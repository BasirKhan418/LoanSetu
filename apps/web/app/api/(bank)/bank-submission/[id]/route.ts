import { NextResponse, NextRequest } from "next/server";
import ConnectDb from "../../../../../middleware/connectDb";
import { cookies } from "next/headers";
import { verifyAdminToken } from "../../../../../utils/verifyToken";

export const GET = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    await ConnectDb();
    
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    
    if (!token) {
      return NextResponse.json(
        { message: "No token provided", success: false },
        { status: 401 }
      );
    }
    
    const data = verifyAdminToken(token);
    
    if (!data.success || data.data?.type !== "bank") {
      return NextResponse.json(
        { message: "Unauthorized access", success: false },
        { status: 401 }
      );
    }
    
    const { id } = await params;
    
    // Import models
    const Submission = (await import("../../../../../models/Submission")).default;
    const LoanDetails = (await import("../../../../../models/LoanDetails")).default;
    
    const submission = await (Submission as any)
      .findById(id)
      .populate("loanId", "loanNumber applicantName sanctionedAmount sanctionDate")
      .populate("beneficiaryId", "name email phone address")
      .populate("loanDetailsId", "assetType assetDescription expectedInvoiceAmount")
      .lean();
    
    if (!submission) {
      return NextResponse.json(
        { message: "Submission not found", success: false },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      submission,
    });
  } catch (error: any) {
    console.error("Error fetching submission:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error", success: false },
      { status: 500 }
    );
  }
};
