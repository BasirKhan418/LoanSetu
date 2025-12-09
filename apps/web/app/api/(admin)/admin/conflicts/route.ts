import { NextRequest, NextResponse } from "next/server";
import connectDb from "../../../../../middleware/connectDb";
import Submission from "../../../../../models/Submission";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await connectDb();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const conflictType = searchParams.get("conflictType") || "all"; 
    const skip = (page - 1) * limit;

    const matchQuery: any = {
      "aiSummary.decision": { $ne: null },
      "review.reviewDecision": { $ne: null },
      isActive: true,
    };

    if (conflictType === "ai-approve-officer-reject") {
      matchQuery["aiSummary.decision"] = "AUTO_APPROVE";
      matchQuery["review.reviewDecision"] = "REJECTED";
    } else if (conflictType === "ai-reject-officer-approve") {
      matchQuery["aiSummary.decision"] = { $in: ["REJECTED", "AUTO_HIGH_RISK"] };
      matchQuery["review.reviewDecision"] = "APPROVED";
    } else if (conflictType === "ai-needresubmit-officer-approve") {
      matchQuery["aiSummary.decision"] = "NEED_RESUBMISSION";
      matchQuery["review.reviewDecision"] = "APPROVED";
    }

    const aggregationPipeline: any[] = [
      {
        $match: matchQuery,
      },
    ];

    if (conflictType === "all") {
      aggregationPipeline.push({
        $match: {
          $or: [
            {
              "aiSummary.decision": "AUTO_APPROVE",
              "review.reviewDecision": "REJECTED",
            },
            {
              "aiSummary.decision": { $in: ["REJECTED", "AUTO_HIGH_RISK"] },
              "review.reviewDecision": "APPROVED",
            },
            {
              "aiSummary.decision": "NEED_RESUBMISSION",
              "review.reviewDecision": "APPROVED",
            },
            {
              "aiSummary.decision": "AUTO_APPROVE",
              "review.reviewDecision": "REJECTED",
            },
          ],
        },
      });
    }

    aggregationPipeline.push(
      {
        $lookup: {
          from: "loans",
          localField: "loanId",
          foreignField: "_id",
          as: "loan",
        },
      },
      {
        $unwind: "$loan",
      },
      {
        $lookup: {
          from: "users",
          localField: "beneficiaryId",
          foreignField: "_id",
          as: "beneficiary",
        },
      },
      {
        $unwind: "$beneficiary",
      },
      {
        $lookup: {
          from: "stateofficers",
          localField: "review.reviewedByOfficerId",
          foreignField: "_id",
          as: "officer",
        },
      },
      {
        $unwind: {
          path: "$officer",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "banks",
          localField: "loan.bankid",
          foreignField: "_id",
          as: "bank",
        },
      },
      {
        $unwind: {
          path: "$bank",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          loanNumber: "$loan.loanNumber",
          beneficiaryName: "$beneficiary.name",
          beneficiaryPhone: "$beneficiary.phone",
          bankName: "$bank.name",
          officerName: "$officer.name",
          officerEmail: "$officer.email",
          aiDecision: "$aiSummary.decision",
          aiRiskScore: "$aiSummary.riskScore",
          aiFlags: "$aiSummary.flags",
          officerDecision: "$review.reviewDecision",
          officerRemarks: "$review.reviewRemarks",
          reviewedAt: "$review.reviewedAt",
          submissionType: 1,
          status: 1,
          createdAt: 1,
          conflictType: {
            $cond: {
              if: {
                $and: [
                  { $eq: ["$aiSummary.decision", "AUTO_APPROVE"] },
                  { $eq: ["$review.reviewDecision", "REJECTED"] },
                ],
              },
              then: "AI_APPROVE_OFFICER_REJECT",
              else: {
                $cond: {
                  if: {
                    $and: [
                      {
                        $in: [
                          "$aiSummary.decision",
                          ["REJECTED", "AUTO_HIGH_RISK"],
                        ],
                      },
                      { $eq: ["$review.reviewDecision", "APPROVED"] },
                    ],
                  },
                  then: "AI_REJECT_OFFICER_APPROVE",
                  else: "OTHER_CONFLICT",
                },
              },
            },
          },
        },
      },
      {
        $sort: { reviewedAt: -1 },
      }
    );

    // Get total count
    const countPipeline = [...aggregationPipeline];
    countPipeline.push({ $count: "total" });
    const countResult = await Submission.aggregate(countPipeline);
    const total = countResult.length > 0 ? countResult[0].total : 0;

    // Get paginated results
    aggregationPipeline.push({ $skip: skip }, { $limit: limit });
    const conflicts = await Submission.aggregate(aggregationPipeline);

    return NextResponse.json({
      success: true,
      data: conflicts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching conflicts:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch conflicts",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
