import { NextResponse,NextRequest } from "next/server";
import Submission from "../../../../models/Submission";
import ConnectDb from "../../../../middleware/connectDb";
import { cookies } from "next/headers";
import { verifyAdminToken } from "../../../../utils/verifyToken";
import Bank from "../../../../models/Bank";
import StateOfficer from "../../../../models/StateOfficer";
import Admin from "../../../../models/Admin";
import Loans from "../../../../models/Loans";
import ConflictOfInterest from "../../../../models/ConflictOfInterest";
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

    console.log("🔔 PUT REQUEST RECEIVED with body:", JSON.stringify(body, null, 2));
    console.log("🔔 Review Decision:", reviewDecision);
    console.log("🔔 Review Remarks:", reviewRemarks);

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
    console.log("═══════════════════════════════════════");
    console.log("🚨 CONFLICT DETECTION START");
    console.log("📝 Submission ID:", submissionId);
    console.log("📝 Updated Submission ID:", updatedSubmission._id);
    console.log("📝 AI Summary exists:", !!updatedSubmission.aiSummary);
    console.log("📝 AI Summary full:", JSON.stringify(updatedSubmission.aiSummary));
    console.log("📝 AI Decision:", updatedSubmission.aiSummary?.decision);
    console.log("📝 Review Decision from body:", reviewDecision);
    console.log("📝 Review Remarks from body:", reviewRemarks);
    console.log("📝 Officer ID from validation:", validation.data?.id);
    console.log("📝 Officer type:", validation.data?.type);
    console.log("📝 Tenant ID:", updatedSubmission.tenantId);
    console.log("📝 Condition check - reviewDecision:", !!reviewDecision, "aiDecision:", !!updatedSubmission.aiSummary?.decision);
    console.log("═══════════════════════════════════════");
    
    if (reviewDecision && updatedSubmission.aiSummary?.decision) {
      console.log("✅ BOTH CONDITIONS MET - Proceeding with conflict check");
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
      } else if (
        aiDecision === "NEED_RESUBMISSION" && 
        officerDecision === "REJECTED"
      ) {
        // This is actually aligned - both want to reject/resubmit, no conflict
        isConflict = false;
      } else if (
        aiDecision === "HUMAN_REVIEW" && 
        (officerDecision === "APPROVED" || officerDecision === "REJECTED")
      ) {
        // HUMAN_REVIEW is neutral - officer can decide either way without conflict
        isConflict = false;
      }

      console.log("🚨 Conflict detection result:", { isConflict, conflictType, aiDecision, officerDecision });

      if (isConflict) {
        console.log("⚠️ CONFLICT DETECTED! Starting conflict recording and notification process...");
        
        // Check if this is a state officer (has ID) or bank officer (has IFSC)
        const isStateOfficer = validation.data?.type === "stateofficer" && validation.data?.id;
        const isBankOfficer = validation.data?.type === "bank" && validation.data?.ifsc;
        
        if (!isStateOfficer && !isBankOfficer) {
          console.warn("⚠️ Cannot record conflict - no valid officer identification");
          console.log("✅ Skipping conflict recording but continuing with submission update");
        } else {
        
        try {
          // Ensure DB connection
          await ConnectDb();
          
          let officer: any = null;
          let officerId: any = null;
          
          if (isStateOfficer) {
            // Get state officer details
            officer = await (StateOfficer as any).findById(validation.data?.id);
            officerId = validation.data?.id;
            console.log("👤 State Officer found:", officer?.name, officer?.email);
          } else if (isBankOfficer) {
            // Get bank officer details
            officer = await (Bank as any).findOne({ ifsc: validation.data?.ifsc });
            officerId = officer?._id;
            console.log("🏦 Bank Officer found:", officer?.name, officer?.contactEmail);
          }
          
          // 1. Store conflict in database
          console.log("📦 Using ConflictOfInterest model");
          
          // Check if conflict already exists to avoid duplicates
          const existingConflict = await (ConflictOfInterest as any).findOne({
            submissionId: updatedSubmission._id,
            officerId: officerId,
            conflictDetected: true
          });
          
          console.log("🔍 Existing conflict check:", existingConflict ? "Found" : "Not found");
          
          let conflictRecord;
          if (existingConflict) {
            console.log("ℹ️ Conflict record already exists, updating...");
            conflictRecord = await (ConflictOfInterest as any).findByIdAndUpdate(
              existingConflict._id,
              {
                aiSummary: updatedSubmission.aiSummary,
                officerRemarks: reviewRemarks || `Officer decision: ${officerDecision}`,
                aiReason: `Decision conflict detected: AI recommended ${aiDecision} but officer decided ${officerDecision}. Conflict type: ${conflictType}`,
                conflictType: conflictType,
                aiDecision: aiDecision,
                officerDecision: officerDecision,
                updatedAt: new Date()
              },
              { new: true }
            );
            console.log("✅ Conflict record updated:", conflictRecord?._id);
          } else {
            console.log("✅ Creating new conflict record with data:", {
              submissionId: updatedSubmission._id,
              officerId: officerId,
              tenantId: updatedSubmission.tenantId,
              conflictType: conflictType,
              aiDecision: aiDecision,
              officerDecision: officerDecision,
            });
            
            conflictRecord = await (ConflictOfInterest as any).create({
              submissionId: updatedSubmission._id,
              officerId: officerId,
              tenantId: updatedSubmission.tenantId,
              aiSummary: updatedSubmission.aiSummary,
              officerRemarks: reviewRemarks || `Officer decision: ${officerDecision}`,
              conflictDetected: true,
              sentimentScore: 5, // Neutral score for decision conflicts
              aiReason: `Decision conflict detected: AI recommended ${aiDecision} but officer decided ${officerDecision}. Conflict type: ${conflictType}`,
              conflictType: conflictType,
              aiDecision: aiDecision,
              officerDecision: officerDecision,
            });
            console.log("✅ Conflict record created successfully with ID:", conflictRecord?._id);
          }
          
          console.log("✅ Conflict record saved:", conflictRecord._id, "- Full record:", JSON.stringify(conflictRecord, null, 2));
          
          // 2. Find all admins for the tenant (including superadmins)
          const admins = await (Admin as any).find({ 
            $or: [
              { tenantId: updatedSubmission.tenantId, isActive: true },
              { isSuperAdmin: true, isActive: true }
            ]
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
        } catch (conflictError: any) {
          console.error('❌ Failed to record and notify conflict:', conflictError);
          console.error('❌ Error details:', {
            message: conflictError?.message,
            stack: conflictError?.stack,
            name: conflictError?.name
          });
        }
        }
      } else {
        console.log("✅ No conflict detected - AI and Officer decisions align or no strong AI opinion");
      }
    } else {
      console.log("❌ SKIPPING CONFLICT CHECK");
      console.log("   - reviewDecision present?", !!reviewDecision, "value:", reviewDecision);
      console.log("   - AI decision present?", !!updatedSubmission.aiSummary?.decision, "value:", updatedSubmission.aiSummary?.decision);
      if (!reviewDecision) {
        console.log("   ⚠️ MISSING reviewDecision in request body!");
      }
      if (!updatedSubmission.aiSummary?.decision) {
        console.log("   ⚠️ MISSING aiSummary.decision in submission!");
      }
    }
    
    // 🔍 CONFLICT ANALYSIS: Additional AI-based sentiment analysis (only if OpenAI key exists and remarks provided)
    // This runs ONLY if there's no decision conflict detected above to avoid duplicates
    if (reviewDecision && reviewRemarks && validation.data?.id && !updatedSubmission.aiSummary?.decision) {
      try {
        console.log("🤖 Running AI-based conflict of interest sentiment analysis...");
        await analyzeConflictOfInterest({
          submission: updatedSubmission,
          officerId: validation.data.id,
          tenantId: updatedSubmission.tenantId,
          officerRemarks: reviewRemarks || "",
        });
        console.log("✅ AI sentiment analysis completed");
      } catch (sentimentError) {
        console.error('❌ Failed to analyze sentiment:', sentimentError);
        // Don't fail the request if sentiment analysis fails
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