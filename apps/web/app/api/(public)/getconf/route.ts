import ConflictOfInterest from "../../../../models/ConflictOfInterest";
import ConnectDb from "../../../../middleware/connectDb";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
    try {
        await ConnectDb();

        const { searchParams } = new URL(req.url);
        const submissionId = searchParams.get("submissionId");
        const tenantId = searchParams.get("tenantId");
        const conflictDetected = searchParams.get("conflictDetected");
        const limit = parseInt(searchParams.get("limit") || "50");
        const page = parseInt(searchParams.get("page") || "1");

        // Build query filters
        const query: any = {};
        if (submissionId) query.submissionId = submissionId;
        if (tenantId) query.tenantId = tenantId;
        if (conflictDetected) query.conflictDetected = conflictDetected === "true";

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Fetch conflicts with populated data
        const conflicts = await ConflictOfInterest.find(query)
            .populate({
                path: "submissionId",
                select: "applicationNumber status createdAt loanId beneficiaryId",
                populate: [
                    { path: "loanId", select: "loanNumber applicantName loanAmount" },
                    { path: "beneficiaryId", select: "name email phone" }
                ]
            })
            .populate({
                path: "officerId",
                select: "name email phone state"
            })
            .populate({
                path: "tenantId",
                select: "name email organizationType state"
            })
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip)
            .lean();

        // Get total count for pagination
        const totalCount = await ConflictOfInterest.countDocuments(query);

        return NextResponse.json({
            message: "Conflicts of interest fetched successfully",
            success: true,
            data: conflicts,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalCount / limit),
                totalRecords: totalCount,
                recordsPerPage: limit
            }
        });
    }
    catch (err: any) {
        console.error("Error fetching conflicts:", err);
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