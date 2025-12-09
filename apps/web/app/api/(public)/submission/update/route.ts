import { NextResponse, NextRequest } from "next/server";
import Submission from "../../../../../models/Submission";
import ConnectDb from "../../../../../middleware/connectDb";
import { appendLedgerEntry } from "../../../../../lib/ledger-service";
import Loans from "../../../../../models/Loans";

export const runtime = "nodejs";

export const PATCH = async (req: NextRequest) => {
    try {
        await ConnectDb();
        const data = await req.json();

        const { submissionId, aiSummary } = data;

        if (!submissionId || !aiSummary) {
            return NextResponse.json(
                { message: "submissionId and aiSummary are required", success: false },
                { status: 400 }
            );
        }

        // Find submission
        const submission = await Submission.findById(submissionId);
        if (!submission) {
            return NextResponse.json(
                { message: "Submission not found", success: false },
                { status: 404 }
            );
        }

        // Update aiSummary
        submission.aiSummary = aiSummary;

        // Update status based on decision
        const decision = aiSummary.decision;
        if (decision === "AUTO_APPROVE") {
            submission.status = "APPROVED";
        } else if (decision === "AUTO_HIGH_RISK") {
            submission.status = "REJECTED";
        } else if (decision === "AUTO_REVIEW") {
            submission.status = "PENDING_REVIEW";
        } else if (decision === "NEED_RESUBMISSION") {
            submission.status = "NEED_RESUBMISSION";
        }

        await submission.save();

        // Update loan with AI decision
        await Loans.findByIdAndUpdate(submission.loanId, {
            lastAiRiskScore: aiSummary.riskScore,
            lastAiDecision: decision,
        } as any);

        // Log to ledger
        try {
            await appendLedgerEntry({
                loanId: submission.loanId.toString(),
                eventType: "AI_VALIDATION_COMPLETED",
                eventData: {
                    submissionId: submissionId,
                    decision: decision,
                    riskScore: aiSummary.riskScore,
                    flags: aiSummary.flags,
                    status: submission.status,
                },
                performedBy: "validation_engine",
            });
        } catch (ledgerError) {
            console.error("Failed to record AI validation in ledger:", ledgerError);
        }

        return NextResponse.json({
            message: "Submission updated successfully",
            data: submission,
            success: true,
        });
    } catch (err: any) {
        console.error("Error updating submission:", err);
        return NextResponse.json(
            {
                message: "Something went wrong, please try again after some time",
                success: false,
                error: err?.message,
            },
            { status: 500 }
        );
    }
};
