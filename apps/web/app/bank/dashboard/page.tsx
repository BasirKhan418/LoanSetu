"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "../../../lib/utils";
import { BankSidebar } from "../../../components/bank/BankSidebar";
import {
  IconCreditCard,
  IconFileAnalytics,
  IconAlertTriangle,
  IconRefresh,
  IconCurrencyRupee,
  IconTrendingUp,
  IconFileDescription,
  IconChartBar,
} from "@tabler/icons-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface AnalyticsData {
  overview: {
    totalLoans: number;
    totalLoanSchemes: number;
    averageVerificationDays: number;
  };
  loans: {
    total: number;
    byStatus: {
      pending: number;
      underReview: number;
      approved: number;
      rejected: number;
    };
    byDisbursementMode: {
      full: number;
      installments: number;
      vendorPayment: number;
    };
    totalSanctionAmount: number;
    averageLoanAmount: number;
    totalSubsidyAmount: number;
    recentLoans: Array<{
      loanNumber: string;
      applicantName: string;
      sanctionAmount: number;
      status: string;
      createdAt: string;
    }>;
  };
  distribution: {
    loansByScheme: Array<{ name: string; count: number }>;
    assetDistribution: Array<{ name: string; count: number }>;
  };
  trends: {
    monthlyLoans: Array<{ month: string; count: number; amount: number }>;
  };
  ai: {
    decisions: {
      autoApprove: number;
      autoReview: number;
      autoHighRisk: number;
      notProcessed: number;
    };
    averageRiskScore: number;
  };
}

const COLORS = ["#f97316", "#3b82f6", "#10b981", "#a855f7", "#ef4444", "#eab308"];
const STATUS_COLORS = {
  PENDING: "#f97316",
  UNDER_REVIEW: "#3b82f6",
  APPROVED: "#10b981",
  REJECTED: "#ef4444"
};

export default function BankDashboard() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [bankData, setBankData] = useState<any>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    validateSession();
  }, []);

  const validateSession = async () => {
    try {
      const response = await fetch("/api/verify", {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (!data.success || data.type !== "bank") {
        router.push("/bank/signin");
        return;
      }

      if (!data.data.isActive) {
        router.push("/bank/signin?error=account-inactive");
        return;
      }

      setBankData(data.data);
      await fetchAnalytics();
      setLoading(false);
    } catch (error) {
      console.error("Session validation error:", error);
      router.push("/bank/signin");
    }
  };

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const response = await fetch("/api/bank-analytics", {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();
      console.log("Bank Analytics Response:", data);

      if (data.success) {
        console.log("Analytics Data:", data.data);
        setAnalytics(data.data);
      } else {
        console.error("Analytics fetch failed:", data.message);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-IN").format(num);
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statsCards = [
    {
      title: "Total Loans",
      value: analytics?.loans.total || 0,
      subtitle: `${analytics?.loans.byStatus.approved || 0} Approved`,
      icon: <IconCreditCard className="h-6 w-6" />,
      color: "from-orange-500 to-orange-600",
    },
    {
      title: "Loan Amount",
      value: analytics ? formatCurrency(analytics.loans.totalSanctionAmount) : "₹0",
      subtitle: `Avg: ${analytics ? formatCurrency(analytics.loans.averageLoanAmount) : "₹0"}`,
      icon: <IconCurrencyRupee className="h-6 w-6" />,
      color: "from-green-500 to-green-600",
    },
    {
      title: "Pending Review",
      value: (analytics?.loans.byStatus.pending || 0) + (analytics?.loans.byStatus.underReview || 0),
      subtitle: `${analytics?.overview.averageVerificationDays || 0} days avg`,
      icon: <IconAlertTriangle className="h-6 w-6" />,
      color: "from-blue-500 to-blue-600",
    },
    {
      title: "Loan Schemes",
      value: analytics?.overview.totalLoanSchemes || 0,
      subtitle: `${analytics?.distribution.loansByScheme.length || 0} Active`,
      icon: <IconFileDescription className="h-6 w-6" />,
      color: "from-purple-500 to-purple-600",
    },
  ];

  // Prepare chart data
  const statusData = analytics ? [
    { name: "Approved", value: analytics.loans.byStatus.approved, color: STATUS_COLORS.APPROVED },
    { name: "Pending", value: analytics.loans.byStatus.pending, color: STATUS_COLORS.PENDING },
    { name: "Under Review", value: analytics.loans.byStatus.underReview, color: STATUS_COLORS.UNDER_REVIEW },
    { name: "Rejected", value: analytics.loans.byStatus.rejected, color: STATUS_COLORS.REJECTED },
  ].filter(item => item.value > 0) : [];

  const aiDecisionData = analytics ? [
    { name: "Auto Approve", value: analytics.ai.decisions.autoApprove },
    { name: "Auto Review", value: analytics.ai.decisions.autoReview },
    { name: "High Risk", value: analytics.ai.decisions.autoHighRisk },
    { name: "Not Processed", value: analytics.ai.decisions.notProcessed },
  ].filter(item => item.value > 0) : [];

  return (
    <div
      className={cn(
        "mx-auto flex w-full flex-1 flex-col overflow-hidden bg-white md:flex-row",
        "h-screen"
      )}
    >
      <BankSidebar open={open} setOpen={setOpen} bankData={bankData || undefined} />
      <div className="flex flex-1 flex-col overflow-auto">
        <div className="flex w-full flex-col gap-4 rounded-tl-2xl border border-neutral-200 bg-white p-4 md:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-neutral-200">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                Bank Officer Dashboard
              </h1>
              <p className="text-sm text-neutral-600 mt-1">
                Welcome, {bankData?.contactName}
              </p>
            </div>
            <button
              onClick={() => { validateSession(); fetchAnalytics(); }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors"
            >
              <IconRefresh className="h-4 w-4" />
              Refresh
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {statsCards.map((stat, idx) => (
              <div
                key={idx}
                className="relative overflow-hidden rounded-xl bg-gradient-to-br p-[1px] shadow-lg"
              >
                <div className={cn("absolute inset-0 bg-gradient-to-br", stat.color)} />
                <div className="relative rounded-xl bg-white p-6 backdrop-blur">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-neutral-600">{stat.title}</p>
                      <p className="text-3xl font-bold text-neutral-900 mt-2">
                        {analyticsLoading ? <span className="animate-pulse">--</span> : stat.value}
                      </p>
                      {stat.subtitle && (
                        <p className="text-xs text-neutral-500 mt-1">{stat.subtitle}</p>
                      )}
                    </div>
                    <div className={cn("p-3 rounded-full bg-gradient-to-br text-white", stat.color)}>
                      {stat.icon}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Loading Analytics Message */}
          {analyticsLoading && !analytics && (
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-8 text-center">
              <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-neutral-600 font-medium">Loading analytics data...</p>
            </div>
          )}

          {/* No Data Message */}
          {!analyticsLoading && analytics && analytics.loans.total === 0 && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-8 text-center">
              <IconFileAnalytics className="h-16 w-16 text-blue-400 mx-auto mb-4" />
              <h3 className="font-semibold text-blue-900 mb-2 text-lg">
                No Loan Data Available
              </h3>
              <p className="text-blue-700 text-sm mb-4">
                There are no loans in the system yet. Once loans are added through bulk upload or manual entry, analytics and charts will appear here.
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => router.push("/bank/bulk-upload")}
                  className="px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors"
                >
                  Bulk Upload Loans
                </button>
                <button
                  onClick={() => router.push("/bank/loan-details")}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  View Loan Products
                </button>
              </div>
            </div>
          )}

          {/* Financial Summary */}
          {analytics && analytics.loans.total > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="rounded-xl border border-neutral-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-6">
                <div className="flex items-center justify-between mb-2">
                  <IconCurrencyRupee className="h-8 w-8 text-emerald-600" />
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">Total</span>
                </div>
                <p className="text-2xl font-bold text-emerald-900">
                  {formatCurrency(analytics.loans.totalSanctionAmount)}
                </p>
                <p className="text-sm text-emerald-700 mt-1">Total Loan Amount</p>
              </div>
              <div className="rounded-xl border border-neutral-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
                <div className="flex items-center justify-between mb-2">
                  <IconTrendingUp className="h-8 w-8 text-blue-600" />
                  <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">Average</span>
                </div>
                <p className="text-2xl font-bold text-blue-900">
                  {formatCurrency(analytics.loans.averageLoanAmount)}
                </p>
                <p className="text-sm text-blue-700 mt-1">Average Loan Size</p>
              </div>
              <div className="rounded-xl border border-neutral-200 bg-gradient-to-br from-purple-50 to-pink-50 p-6">
                <div className="flex items-center justify-between mb-2">
                  <IconFileAnalytics className="h-8 w-8 text-purple-600" />
                  <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-full">Subsidy</span>
                </div>
                <p className="text-2xl font-bold text-purple-900">
                  {formatCurrency(analytics.loans.totalSubsidyAmount)}
                </p>
                <p className="text-sm text-purple-700 mt-1">Total Subsidy Amount</p>
              </div>
            </div>
          )}

          {/* Charts Section */}
          {analytics && analytics.loans.total > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Loan Status Distribution */}
              {statusData.length > 0 && (
                <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-neutral-900 mb-4">Loan Status Distribution</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Monthly Loan Trend */}
              <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">Monthly Loan Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.trends.monthlyLoans}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="count" stroke="#f97316" strokeWidth={2} name="Loans" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Loans by Scheme */}
              {analytics.distribution.loansByScheme.length > 0 && (
                <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-neutral-900 mb-4">Top Loan Schemes</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.distribution.loansByScheme.slice(0, 5)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#f97316" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* AI Decision Analysis */}
              {aiDecisionData.length > 0 && (
                <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-neutral-900 mb-4">AI Decision Analysis</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={aiDecisionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {aiDecisionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 text-center">
                    <p className="text-sm text-neutral-600">Average Risk Score</p>
                    <p className="text-2xl font-bold text-orange-600">{analytics.ai.averageRiskScore}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Recent Loans */}
          {analytics && analytics.loans.recentLoans.length > 0 && (
            <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Recent Loans</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase">Loan Number</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase">Applicant</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase">Amount</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase">Status</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {analytics.loans.recentLoans.map((loan, idx) => (
                      <tr key={idx} className="hover:bg-neutral-50">
                        <td className="px-4 py-3 text-sm font-mono text-neutral-900">{loan.loanNumber}</td>
                        <td className="px-4 py-3 text-sm text-neutral-900">{loan.applicantName}</td>
                        <td className="px-4 py-3 text-sm text-neutral-900">{formatCurrency(loan.sanctionAmount)}</td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "px-2 py-1 text-xs font-medium rounded-full",
                            loan.status === "APPROVED" && "bg-green-100 text-green-700",
                            loan.status === "PENDING" && "bg-orange-100 text-orange-700",
                            loan.status === "UNDER_REVIEW" && "bg-blue-100 text-blue-700",
                            loan.status === "REJECTED" && "bg-red-100 text-red-700"
                          )}>
                            {loan.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-neutral-600">
                          {new Date(loan.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Bank Details */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Bank Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Bank:</span>
                  <span className="font-medium text-neutral-900">{bankData?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Branch:</span>
                  <span className="font-medium text-neutral-900">{bankData?.branchName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">IFSC:</span>
                  <span className="font-medium text-neutral-900 font-mono">{bankData?.ifsc}</span>
                </div>
                {bankData?.state && (
                  <div className="flex justify-between">
                    <span className="text-neutral-600">State:</span>
                    <span className="font-medium text-neutral-900">{bankData.state}</span>
                  </div>
                )}
                {bankData?.district && (
                  <div className="flex justify-between">
                    <span className="text-neutral-600">District:</span>
                    <span className="font-medium text-neutral-900">{bankData.district}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Contact Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Officer:</span>
                  <span className="font-medium text-neutral-900">{bankData?.contactName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Email:</span>
                  <span className="font-medium text-neutral-900">{bankData?.contactEmail}</span>
                </div>
                {bankData?.contactPhone && (
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Phone:</span>
                    <span className="font-medium text-neutral-900">{bankData.contactPhone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "h-2 w-2 rounded-full",
                    bankData?.isActive ? "bg-green-500" : "bg-red-500"
                  )} />
                  <span className="text-neutral-700">
                    {bankData?.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
