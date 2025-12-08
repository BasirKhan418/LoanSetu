import { NextResponse,NextRequest } from "next/server";
import Submission from "../../../../models/Submission";
import ConnectDb from "../../../../middleware/connectDb";
import { cookies } from "next/headers";
import { verifyAdminToken } from "../../../../utils/verifyToken";
import Bank from "../../../../models/Bank";
import StateOfficer from "../../../../models/StateOfficer";
import Loans from "../../../../models/Loans";
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

    /**
     * 1) AI UPDATE (generic)
     * - Used when AI engine posts back results
     * - Just check if aiSummary exists in payload
     */
    if (aiSummary) {
      updates.aiSummary = {
        riskScore: aiSummary.riskScore,
        decision: aiSummary.decision ?? null,
        flags: aiSummary.flags || [],
        features: aiSummary.features || {},
        validatedAt: aiSummary.validatedAt || new Date().toISOString(),
      };

      // if only AI is updating, set status to AI_COMPLETED unless
      // caller explicitly sends a status override
      if (!status) {
        updates.status = "AI_COMPLETED";
      }

    }

    /**
     * 2) OFFICER REVIEW UPDATE (generic)
     * - Used when officer acts on the submission
     * - Only needs reviewDecision and optional remarks
     */
    if (reviewDecision) {
      updates["review.reviewDecision"] = reviewDecision; // "APPROVED" | "REJECTED" | "ASK_RESUBMISSION"
      updates["review.reviewRemarks"] = reviewRemarks || "";
      updates["review.reviewedAt"] = new Date();
      updates["review.reviewedByOfficerId"] = validation.data?.id;

      // Map reviewDecision to submission.status if caller didn't override
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

    /**
     * 3) APPEAL UPDATE (optional, generic)
     * - Used by beneficiary (via admin) or state admin to handle appeals
     * - Payload: appeal: { isAppealed, appealReason, appealStatus }
     */
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

    /**
     * 4) Explicit STATUS override (generic)
     * - If caller sends "status", we respect it
     * - Use carefully (mainly for admin tooling)
     */
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
    );
    const updateloans = await (Loans as any).findByIdAndUpdate(
      updatedSubmission.loanId,
      { $set: { verificationStatus: updatedSubmission.status } }
    );

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