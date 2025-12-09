import { NextResponse,NextRequest } from "next/server";
import Submission from "../../../../models/Submission";
import ConnectDb from "../../../../middleware/connectDb";
import { cookies } from "next/headers";
import { verifyAdminToken } from "../../../../utils/verifyToken";
import Bank from "../../../../models/Bank";
import StateOfficer from "../../../../models/StateOfficer";
import Admin from "../../../../models/Admin";
import Loans from "../../../../models/Loans";
import { appendLedgerEntry } from "../../../../lib/ledger-service";
import { analyzeConflictOfInterest } from "../../../../lib/conflict-engine";
import { sendConflictNotificationEmail } from "../../../../lib/email-service";
export const GET = async (req: NextRequest) => {
    try{
        await ConnectDb();
        const cookes = await cookies();
        const token = cookes.get("token")?.value;
        console.log("Token from cookies:", token ? "Present" : "Missing");
        
        if (!token) {
            return NextResponse.json({message:"Token not found",success:false},{status:401});
        }
        
        const validation = verifyAdminToken(token);
        console.log("Token validation result:", validation);
        const isverify = validation.data?.type==="bank"||validation.data?.type==="stateofficer";

        if(!validation.success||!isverify){
            console.log("Validation failed or wrong type. Success:", validation.success, "Type:", validation.data?.type);
            return NextResponse.json({message:"Unauthorized access",success:false},{status:403});
        }
        if(validation.data?.type==="bank"){
            
            const fetchbankDetails = await Bank.findOne({ ifsc: validation.data?.ifsc } as any);
            if (!fetchbankDetails) {
                return NextResponse.json(
                    { message: "Bank details not found", success: false },
                    { status: 404 }
                );
            }
            const findallsubmissions = await Submission.find({ tenantId: fetchbankDetails.tenantId } as any)
                .populate('loanId', 'loanNumber applicantName')
                .populate('beneficiaryId', 'name email');
            return NextResponse.json({message:"Submissions fetched successfully by bank",data:findallsubmissions,success:true});
        }
        else if(validation.data?.type==="stateofficer"){
            await ConnectDb();
            console.log("State Officer ID from token:", validation.data?.id);
            const fetchstateofficerDetails = await (StateOfficer as any).findById(validation.data?.id as any);
            console.log("State Officer Details:", fetchstateofficerDetails);
            if (!fetchstateofficerDetails) {
                return NextResponse.json(
                    { message: "State Officer details not found", success: false },
                    { status: 404 }
                );
            }
            console.log("Fetching submissions for tenantId:", fetchstateofficerDetails.tenantId);
            const findallsubmissions = await Submission.find({ tenantId: fetchstateofficerDetails.tenantId } as any)
                .populate('loanId', 'loanNumber applicantName')
                .populate('beneficiaryId', 'name email');
            console.log("Found submissions:", findallsubmissions.length);
            return NextResponse.json({message:"Submissions fetched successfully by state officer",data:findallsubmissions,success:true});
        }
        console.log("kuch nahi milla");
        return NextResponse.json({message:"Unauthorized access",success:false},{status:403});
    }
    catch(err:any){
        console.error("Error in GET /api/editsubmission:", err);
        return NextResponse.json(
            {
                message: "Something went wrong, please try again after some time",
                success: false,
                error: err?.message,
                stack: process.env.NODE_ENV === 'development' ? err?.stack : undefined
            },
            { status: 500 }
        );
    }
}


//update end point for submission by id
export const PUT= async (req: NextRequest) => {
    try{
        await ConnectDb();
        const cookes = await cookies();
        const token = cookes.get("token")?.value;
        const validation = verifyAdminToken(token!);
        console.log(validation);
        const isverify = validation.data?.type==="bank"||validation.data?.type==="stateofficer";

        if(!validation.success||!isverify){
            return NextResponse.json({message:"Unauthorized access",success:false},{status:403});
        }
        const body = await req.json();
    const {
      submissionId,
      aiSummary,        // { riskScore, decision, flags, features, validatedAt }
      reviewDecision,   // "APPROVED" | "REJECTED" | "ASK_RESUBMISSION"
      reviewRemarks,
      status,           // optional manual override
      appeal            // { isAppealed, appealReason, appealStatus }
    } = body;

    if (!submissionId) {
      return NextResponse.json(
        { message: "submissionId is required", success: false },
        { status: 400 }
      );
    }

    const submission = await (Submission as any).findById(submissionId);
    if (!submission) {
      return NextResponse.json(
        { message: "Submission not found", success: false },
        { status: 404 }
      );
    }

    const updates: any = {};

  
    if (aiSummary) {
      updates.aiSummary = {
        riskScore: aiSummary.riskScore,
        decision: aiSummary.decision ?? null,
        flags: aiSummary.flags || [],
        features: aiSummary.features || {},
        validatedAt: aiSummary.validatedAt || new Date().toISOString(),
      };

      
      if (!status) {
        updates.status = "AI_COMPLETED";
      }

    }

    if (reviewDecision) {
      updates["review.reviewDecision"] = reviewDecision; // "APPROVED" | "REJECTED" | "ASK_RESUBMISSION"
      updates["review.reviewRemarks"] = reviewRemarks || "";
      updates["review.reviewedAt"] = new Date();
      updates["review.reviewedByOfficerId"] = validation.data?.id;

      if (!status) {
        if (reviewDecision === "APPROVED") {
          updates.status = "APPROVED";
        } else if (reviewDecision === "REJECTED") {
          updates.status = "REJECTED";
        } else if (reviewDecision === "ASK_RESUBMISSION") {
          updates.status = "NEED_RESUBMISSION";
        }
      }
    }

    if (appeal) {
      if (typeof appeal.isAppealed === "boolean") {
        updates["appeal.isAppealed"] = appeal.isAppealed;
      }
      if (typeof appeal.appealReason === "string") {
        updates["appeal.appealReason"] = appeal.appealReason;
      }
      if (appeal.appealStatus) {
        updates["appeal.appealStatus"] = appeal.appealStatus; // "PENDING" | "ACCEPTED" | "REJECTED"
        updates["appeal.appealHandledById"] = validation.data?.id;
        updates["appeal.appealHandledAt"] = new Date();
      }
    }

  
    if (status) {
      updates.status = status;
    }

    // If no updates detected, return early
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { message: "No valid fields to update", success: false },
        { status: 400 }
      );
    }

    const updatedSubmission = await (Submission as any).findByIdAndUpdate(
      submissionId,
      { $set: updates },
      { new: true }
    )
    .populate('loanId', 'loanNumber')
    .populate('beneficiaryId', 'name');
    
    const updateloans = await (Loans as any).findByIdAndUpdate(
      updatedSubmission.loanId._id,
      { $set: { verificationStatus: updatedSubmission.status } }
    )
    .populate('bankid', 'name');

    // 🚨 CONFLICT DETECTION: Check if AI and Officer decisions conflict
    console.log("🔍 Checking for conflicts - reviewDecision:", reviewDecision, "aiDecision:", updatedSubmission.aiSummary?.decision);
    
    if (reviewDecision && updatedSubmission.aiSummary?.decision) {
      const aiDecision = updatedSubmission.aiSummary.decision;
      const officerDecision = reviewDecision;
      
      let isConflict = false;
      let conflictType = "";

      // Detect conflict scenarios
      if (aiDecision === "AUTO_APPROVE" && officerDecision === "REJECTED") {
        isConflict = true;
        conflictType = "AI_APPROVE_OFFICER_REJECT";
      } else if (
        (aiDecision === "REJECTED" || aiDecision === "AUTO_HIGH_RISK") && 
        officerDecision === "APPROVED"
      ) {
        isConflict = true;
        conflictType = "AI_REJECT_OFFICER_APPROVE";
      } else if (
        aiDecision === "NEED_RESUBMISSION" && 
        officerDecision === "APPROVED"
      ) {
        isConflict = true;
        conflictType = "AI_NEEDRESUBMIT_OFFICER_APPROVE";
      }

      console.log("🚨 Conflict detection result:", { isConflict, conflictType, aiDecision, officerDecision });

      if (isConflict) {
        console.log("⚠️ CONFLICT DETECTED! Starting conflict recording and notification process...");
        
        try {
          // Get officer details
          const officer = await (StateOfficer as any).findById(validation.data?.id);
          console.log("👤 Officer found:", officer?.name, officer?.email);
          
          // 1. Store conflict in database
          const ConflictOfInterest = (await import("../../../../models/ConflictOfInterest")).default;
          const conflictRecord = await (ConflictOfInterest as any).create({
            submissionId: updatedSubmission._id,
            officerId: validation.data?.id,
            tenantId: updatedSubmission.tenantId,
            aiSummary: updatedSubmission.aiSummary,
            officerRemarks: reviewRemarks || `Officer decision: ${officerDecision}`,
            conflictDetected: true,
            sentimentScore: 5, // Neutral score for decision conflicts
            aiReason: `Decision conflict detected: AI recommended ${aiDecision} but officer decided ${officerDecision}. Conflict type: ${conflictType}`,
          });
          
          console.log("✅ Conflict record created:", conflictRecord._id);
          
          // 2. Find all admins for the tenant
          const admins = await (Admin as any).find({ 
            tenantId: updatedSubmission.tenantId,
            isActive: true 
          }).select('email name');

          console.log(`📧 Found ${admins.length} admin(s) to notify:`, admins.map((a: any) => a.email));

          if (admins.length === 0) {
            console.warn("⚠️ No admins found for tenantId:", updatedSubmission.tenantId);
          }

          // 3. Send email to all admins
          const emailPromises = admins.map((admin: any) => 
            sendConflictNotificationEmail({
              adminEmail: admin.email,
              adminName: admin.name,
              conflictData: {
                loanNumber: updatedSubmission.loanId?.loanNumber || 'N/A',
                beneficiaryName: updatedSubmission.beneficiaryId?.name || 'N/A',
                aiDecision: aiDecision,
                aiRiskScore: updatedSubmission.aiSummary?.riskScore,
                officerDecision: officerDecision,
                officerName: officer?.name || 'Unknown Officer',
                bankName: updateloans?.bankid?.name || 'N/A',
                conflictType: conflictType,
                submissionId: submissionId,
              }
            })
          );

          const results = await Promise.allSettled(emailPromises);
          const successCount = results.filter((r: PromiseSettledResult<any>) => r.status === 'fulfilled').length;
          const failCount = results.filter((r: PromiseSettledResult<any>) => r.status === 'rejected').length;
          
          console.log(`✅ Email notifications complete: ${successCount} sent, ${failCount} failed`);
          
          if (failCount > 0) {
            results.forEach((result: PromiseSettledResult<any>, index: number) => {
              if (result.status === 'rejected') {
                console.error(`❌ Failed to send email to ${admins[index].email}:`, result.reason);
              }
            });
          }
        } catch (emailError) {
          console.error('❌ Failed to send conflict notification emails:', emailError);
          // Don't fail the request if email fails
        }
      } else {
        console.log("✅ No conflict detected - AI and Officer decisions align");
      }
    } else {
      console.log("ℹ️ Skipping conflict check - missing reviewDecision or AI decision");
    }
    
    // 🔍 CONFLICT ANALYSIS: Additional AI-based sentiment analysis (only if OpenAI key exists and remarks provided)
    if (reviewDecision && reviewRemarks && validation.data?.id) {
      try {
        console.log("🤖 Running AI-based conflict of interest analysis...");
        await analyzeConflictOfInterest({
          submission: updatedSubmission,
          officerId: validation.data.id,
          tenantId: updatedSubmission.tenantId,
          officerRemarks: reviewRemarks || "",
        });
        console.log("✅ AI conflict analysis completed");
      } catch (conflictError) {
        console.error('❌ Failed to analyze conflict of interest:', conflictError);
        // Don't fail the request if conflict analysis fails
      }
    }
    
    // 🔗 LEDGER: Record submission status changes
    try {
      let eventType = 'SUBMISSION_UPDATED';
      
      // Determine specific event type based on the update
      if (reviewDecision === 'APPROVED') {
        eventType = 'LOAN_APPROVED';
      } else if (reviewDecision === 'REJECTED') {
        eventType = 'LOAN_REJECTED';
      } else if (reviewDecision === 'ASK_RESUBMISSION') {
        eventType = 'RESUBMISSION_REQUESTED';
      } else if (aiSummary) {
        eventType = 'AI_VALIDATION_COMPLETED';
      } else if (appeal?.appealStatus) {
        eventType = 'APPEAL_' + appeal.appealStatus;
      }
      
      await appendLedgerEntry({
        loanId: updatedSubmission.loanId.toString(),
        eventType,
        eventData: {
          submissionId: submissionId,
          previousStatus: submission.status,
          newStatus: updatedSubmission.status,
          reviewDecision: reviewDecision || 'N/A',
          reviewRemarks: reviewRemarks || '',
          aiRiskScore: aiSummary?.riskScore,
          updatedBy: validation.data?.type,
          updatedAt: new Date().toISOString(),
        },
        performedBy: validation.data?.email || validation.data?.ifsc || validation.data?.id || 'officer',
      });
    } catch (ledgerError) {
      console.error('Failed to record submission update in ledger:', ledgerError);
    }

    return NextResponse.json({
      message: "Submission updated successfully",
      data: updatedSubmission,
      success: true,
    });
    }
    catch(err:any){
        return NextResponse.json(
            {
                message: "Something went wrong, please try again after some time",
                success: false,
                error: err?.message
            },
            { status: 500 }
        );
    }
}