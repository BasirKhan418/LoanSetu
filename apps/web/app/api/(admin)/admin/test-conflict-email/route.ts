import { NextRequest, NextResponse } from "next/server";
import { sendConflictNotificationEmail } from "../../../../../email/sendConflictNotificationEmail";

export const dynamic = "force-dynamic";

/**
 * Test endpoint to verify conflict email notifications
 * POST /api/admin/test-conflict-email
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { adminEmail, adminName } = body;

    if (!adminEmail) {
      return NextResponse.json(
        { success: false, message: "adminEmail is required" },
        { status: 400 }
      );
    }

    console.log("🧪 Testing conflict email notification...");

    const result = await sendConflictNotificationEmail({
      adminEmail,
      adminName: adminName || "Test Admin",
      conflictData: {
        loanNumber: "TEST-LOAN-001",
        beneficiaryName: "Test Beneficiary",
        aiDecision: "AUTO_APPROVE",
        aiRiskScore: 25,
        officerDecision: "REJECTED",
        officerName: "Test Officer",
        bankName: "Test Bank",
        conflictType: "AI_APPROVE_OFFICER_REJECT",
        submissionId: "test-submission-id",
      },
    });

    console.log("🧪 Test email result:", result);

    return NextResponse.json({
      success: result.success,
      message: result.message,
      details: result,
    });
  } catch (error: any) {
    console.error("❌ Error in test email endpoint:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to send test email",
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
