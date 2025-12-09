import { NextResponse, NextRequest } from "next/server";
import ConflictOfInterest from "../../../../models/ConflictOfInterest";
import ConnectDb from "../../../../middleware/connectDb";

export const GET = async (req: NextRequest) => {
  try {
    await ConnectDb();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      // Fetch a single conflict by ID
      const conflict = await (ConflictOfInterest as any).findById(id)
        .populate("submissionId", "name email phone aiSummary status")
        .populate("officerId", "name email")
        .populate("tenantId", "name code state")
        .lean();

      if (!conflict) {
        return NextResponse.json({
          message: "Conflict not found",
          success: false,
        });
      }

      return NextResponse.json({
        message: "Conflict fetched successfully",
        data: conflict,
        success: true,
      });
    } else {
      // Fetch all conflicts
      const conflicts = await ConflictOfInterest.find()
        .populate("submissionId", "name email phone aiSummary status reviewDecision")
        .populate("officerId", "name email")
        .populate("tenantId", "name code state")
        .sort({ createdAt: -1 })
        .lean();

      return NextResponse.json({
        message: "Conflicts fetched successfully",
        data: conflicts,
        success: true,
      });
    }
  } catch (err) {
    console.error("Error fetching conflicts:", err);
    return NextResponse.json({
      message: "Error fetching conflicts",
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
};
