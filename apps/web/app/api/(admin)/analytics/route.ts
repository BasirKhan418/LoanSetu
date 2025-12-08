import { NextResponse, NextRequest } from "next/server";
import ConnectDb from "../../../../middleware/connectDb";
import Tenant from "../../../../models/Tenant";
import User from "../../../../models/User";
import Bank from "../../../../models/Bank";
import StateOfficer from "../../../../models/StateOfficer";
import Loan from "../../../../models/Loans";
import LoanDetails from "../../../../models/LoanDetails";

export const GET = async (req: NextRequest) => {
  try {
    await ConnectDb();

    const [tenants, users, banks, stateOfficers, loans, loanDetails] = await Promise.all([
      (Tenant as any).find({}).lean(),
      (User as any).find({}).lean(),
      (Bank as any).find({}).lean(),
      (StateOfficer as any).find({}).lean(),
      (Loan as any).find({}).lean(),
      (LoanDetails as any).find({}).lean(),
    ]);

    // Calculate statistics
    const totalTenants = tenants.length;
    const totalUsers = users.length;
    const totalBanks = banks.length;
    const totalStateOfficers = stateOfficers.length;
    const totalLoans = loans.length;
    const totalLoanSchemes = loanDetails.length;

    // Active vs Inactive counts
    const activeTenants = tenants.filter((t: any) => t.isActive).length;
    const activeUsers = users.filter((u: any) => u.isActive).length;
    const activeBanks = banks.filter((b: any) => b.isActive).length;
    const activeStateOfficers = stateOfficers.filter((o: any) => o.isActive).length;

    // Verified users and officers
    const verifiedUsers = users.filter((u: any) => u.isVerified).length;
    const verifiedStateOfficers = stateOfficers.filter((o: any) => o.isVerified).length;

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

    // Loans by bank
    const loansByBank: Record<string, number> = {};
    loans.forEach((loan: any) => {
      const bankId = loan.bankid?.toString() || "Unknown";
      loansByBank[bankId] = (loansByBank[bankId] || 0) + 1;
    });

    // Map bank IDs to bank names
    const loansByBankName = await Promise.all(
      Object.entries(loansByBank).map(async ([bankId, count]) => {
        if (bankId === "Unknown") return { name: "Unknown", count };
        const bank = banks.find((b: any) => b._id.toString() === bankId);
        return { name: bank?.name || "Unknown", count };
      })
    );

    // Loans by tenant/state
    const loansByTenant: Record<string, number> = {};
    loans.forEach((loan: any) => {
      const tenantId = loan.tenantId?.toString() || "Unknown";
      loansByTenant[tenantId] = (loansByTenant[tenantId] || 0) + 1;
    });

    const loansByState = await Promise.all(
      Object.entries(loansByTenant).map(async ([tenantId, count]) => {
        if (tenantId === "Unknown") return { state: "Unknown", count };
        const tenant = tenants.find((t: any) => t._id.toString() === tenantId);
        return { state: tenant?.state || "Unknown", count };
      })
    );

    // Users by state
    const usersByState: Record<string, number> = {};
    users.forEach((user: any) => {
      const state = user.state || "Unknown";
      usersByState[state] = (usersByState[state] || 0) + 1;
    });

    const userDistribution = Object.entries(usersByState).map(([state, count]) => ({
      state,
      count,
    }));

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
      
      monthlyLoanData.push({
        month: date.toLocaleString("default", { month: "short", year: "numeric" }),
        count,
      });
    }

    // Recent loans (last 5)
    const recentLoans = loans
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map((loan: any) => ({
        loanNumber: loan.loanNumber,
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

    return NextResponse.json({
      success: true,
      message: "Analytics data fetched successfully",
      data: {
        overview: {
          totalTenants,
          totalUsers,
          totalBanks,
          totalStateOfficers,
          totalLoans,
          totalLoanSchemes,
          activeTenants,
          activeUsers,
          activeBanks,
          activeStateOfficers,
          verifiedUsers,
          verifiedStateOfficers,
        },
        loans: {
          total: totalLoans,
          byStatus: loansByStatus,
          byDisbursementMode: loansByDisbursementMode,
          totalSanctionAmount,
          averageLoanAmount,
          recentLoans,
        },
        distribution: {
          loansByBankName: loansByBankName.sort((a, b) => b.count - a.count).slice(0, 10),
          loansByState: loansByState.sort((a, b) => b.count - a.count),
          userDistribution: userDistribution.sort((a, b) => b.count - a.count),
        },
        trends: {
          monthlyLoans: monthlyLoanData,
        },
        ai: {
          decisions: aiDecisions,
          averageRiskScore: Math.round(averageRiskScore * 100) / 100,
        },
      },
    });
  } catch (err) {
    console.error("Analytics API Error:", err);
    return NextResponse.json({
      success: false,
      message: "Error fetching analytics data",
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
};
