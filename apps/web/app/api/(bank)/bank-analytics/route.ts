import { NextResponse, NextRequest } from "next/server";
import ConnectDb from "../../../../middleware/connectDb";
import Loan from "../../../../models/Loans";
import LoanDetails from "../../../../models/LoanDetails";
import User from "../../../../models/User";
import { cookies } from "next/headers";
import { verifyAdminToken } from "../../../../utils/verifyToken";

export const GET = async (req: NextRequest) => {
  try {
    await ConnectDb();
    console.log("Bank Analytics API: Starting...");
    
    // Verify bank authentication
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    
    if (!token) {
      console.log("Bank Analytics API: No token provided");
      return NextResponse.json({ message: "No token provided", success: false }, { status: 401 });
    }
    
    const data = verifyAdminToken(token);
    console.log("Bank Analytics API: Token verified, type:", data.data?.type);
    
    if (!data.success || data.data?.type !== "bank") {
      console.log("Bank Analytics API: Unauthorized access");
      return NextResponse.json({ message: "Unauthorized access", success: false }, { status: 401 });
    }
    
    const bankIfsc = data.data.ifsc;
    console.log("Bank Analytics API: Bank IFSC:", bankIfsc);
    
    // Find the bank by IFSC to get its ID
    const Bank = (await import("../../../../models/Bank")).default;
    const bank = await (Bank as any).findOne({ ifsc: bankIfsc }).lean();
    
    if (!bank) {
      console.log("Bank Analytics API: Bank not found for IFSC:", bankIfsc);
      return NextResponse.json({ 
        message: "Bank not found", 
        success: false 
      }, { status: 404 });
    }
    
    console.log("Bank Analytics API: Bank found, ID:", bank._id);
    
    // Fetch all loans and loan details for this bank
    const [loans, loanDetails, users] = await Promise.all([
      (Loan as any).find({ bankid: bank._id }).lean(),
      (LoanDetails as any).find({}).lean(),
      (User as any).find({}).lean(),
    ]);
    
    console.log(`Bank Analytics API: Found ${loans.length} loans, ${loanDetails.length} loan details`);

    const totalLoans = loans.length;
    
    // Loan status breakdown
    const loansByStatus = {
      pending: loans.filter((l: any) => l.verificationStatus === "PENDING").length,
      underReview: loans.filter((l: any) => l.verificationStatus === "UNDER_REVIEW").length,
      approved: loans.filter((l: any) => l.verificationStatus === "APPROVED").length,
      rejected: loans.filter((l: any) => l.verificationStatus === "REJECTED").length,
    };

    // Loan disbursement mode breakdown
    const loansByDisbursementMode = {
      full: loans.filter((l: any) => l.disbursementMode === "FULL").length,
      installments: loans.filter((l: any) => l.disbursementMode === "INSTALLMENTS").length,
      vendorPayment: loans.filter((l: any) => l.disbursementMode === "VENDOR_PAYMENT").length,
    };

    // Financial analytics
    const totalSanctionAmount = loans.reduce((sum: number, loan: any) => sum + (loan.sanctionAmount || 0), 0);
    const averageLoanAmount = totalLoans > 0 ? totalSanctionAmount / totalLoans : 0;
    const totalSubsidyAmount = loans.reduce((sum: number, loan: any) => sum + (loan.subsidyAmount || 0), 0);

    // Loans by loan type/scheme
    const loansByType: Record<string, number> = {};
    loans.forEach((loan: any) => {
      const schemeId = loan.loanDetailsId?.toString() || "Unknown";
      loansByType[schemeId] = (loansByType[schemeId] || 0) + 1;
    });

    const loansByScheme = Object.entries(loansByType).map(([schemeId, count]) => {
      if (schemeId === "Unknown") return { name: "Unknown", count };
      const scheme = loanDetails.find((ld: any) => ld._id.toString() === schemeId);
      return { name: scheme?.name || "Unknown", count };
    }).sort((a, b) => b.count - a.count).slice(0, 10);

    // Monthly loan trend (last 6 months)
    const monthlyLoanData = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const count = loans.filter((loan: any) => {
        const loanDate = new Date(loan.createdAt);
        return loanDate >= date && loanDate < nextDate;
      }).length;
      
      const amount = loans
        .filter((loan: any) => {
          const loanDate = new Date(loan.createdAt);
          return loanDate >= date && loanDate < nextDate;
        })
        .reduce((sum: number, loan: any) => sum + (loan.sanctionAmount || 0), 0);
      
      monthlyLoanData.push({
        month: date.toLocaleString("default", { month: "short" }),
        count,
        amount,
      });
    }

    // Recent loans (last 10)
    const recentLoans = loans
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map((loan: any) => ({
        loanNumber: loan.loanNumber,
        applicantName: loan.applicantName,
        sanctionAmount: loan.sanctionAmount,
        status: loan.verificationStatus,
        createdAt: loan.createdAt,
      }));

    // AI decision breakdown
    const aiDecisions = {
      autoApprove: loans.filter((l: any) => l.lastAiDecision === "AUTO_APPROVE").length,
      autoReview: loans.filter((l: any) => l.lastAiDecision === "AUTO_REVIEW").length,
      autoHighRisk: loans.filter((l: any) => l.lastAiDecision === "AUTO_HIGH_RISK").length,
      notProcessed: loans.filter((l: any) => !l.lastAiDecision).length,
    };

    // Average AI risk score
    const loansWithRiskScore = loans.filter((l: any) => l.lastAiRiskScore != null);
    const averageRiskScore = loansWithRiskScore.length > 0
      ? loansWithRiskScore.reduce((sum: number, loan: any) => sum + loan.lastAiRiskScore, 0) / loansWithRiskScore.length
      : 0;

    // Loans by asset type
    const loansByAsset: Record<string, number> = {};
    loans.forEach((loan: any) => {
      const assetType = loan.assetType || "Unknown";
      loansByAsset[assetType] = (loansByAsset[assetType] || 0) + 1;
    });

    const assetDistribution = Object.entries(loansByAsset)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Verification timeline (average days to verify)
    const verifiedLoans = loans.filter((l: any) => 
      l.verificationStatus === "APPROVED" || l.verificationStatus === "REJECTED"
    );
    
    const averageVerificationTime = verifiedLoans.length > 0
      ? verifiedLoans.reduce((sum: number, loan: any) => {
          const created = new Date(loan.createdAt).getTime();
          const updated = new Date(loan.updatedAt).getTime();
          const days = (updated - created) / (1000 * 60 * 60 * 24);
          return sum + days;
        }, 0) / verifiedLoans.length
      : 0;

    const responseData = {
      overview: {
        totalLoans,
        totalLoanSchemes: loanDetails.length,
        averageVerificationDays: Math.round(averageVerificationTime * 10) / 10,
      },
      loans: {
        total: totalLoans,
        byStatus: loansByStatus,
        byDisbursementMode: loansByDisbursementMode,
        totalSanctionAmount,
        averageLoanAmount,
        totalSubsidyAmount,
        recentLoans,
      },
      distribution: {
        loansByScheme,
        assetDistribution,
      },
      trends: {
        monthlyLoans: monthlyLoanData,
      },
      ai: {
        decisions: aiDecisions,
        averageRiskScore: Math.round(averageRiskScore * 100) / 100,
      },
    };

    console.log("Bank Analytics API: Returning data with", totalLoans, "loans");
    
    return NextResponse.json({
      success: true,
      message: "Bank analytics data fetched successfully",
      data: responseData,
    });
  } catch (err) {
    console.error("Bank Analytics API Error:", err);
    return NextResponse.json({
      success: false,
      message: "Error fetching bank analytics data",
      error: err instanceof Error ? err.message : "Unknown error",
    }, { status: 500 });
  }
};
