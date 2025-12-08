"use client";
import React, { useEffect, useState } from "react";
import {
  IconUsers,
  IconBuildingBank,
  IconUserShield,
  IconBuilding,
  IconEdit,
  IconSearch,
  IconRefresh,
  IconFileAnalytics,
  IconCurrencyRupee,
} from "@tabler/icons-react";
import { cn } from "../../lib/utils";
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

interface DashboardProps {
  className?: string;
}

interface Tenant {
  _id: string;
  code: string;
  name: string;
  state: string;
  district?: string;
  email?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
}

interface StatsCard {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
  subtitle?: string;
}

interface AnalyticsData {
  overview: {
    totalTenants: number;
    totalUsers: number;
    totalBanks: number;
    totalStateOfficers: number;
    totalLoans: number;
    totalLoanSchemes: number;
    activeTenants: number;
    activeUsers: number;
    activeBanks: number;
    activeStateOfficers: number;
    verifiedUsers: number;
    verifiedStateOfficers: number;
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
    recentLoans: Array<{
      loanNumber: string;
      sanctionAmount: number;
      status: string;
      createdAt: string;
    }>;
  };
  distribution: {
    loansByBankName: Array<{ name: string; count: number }>;
    loansByState: Array<{ state: string; count: number }>;
    userDistribution: Array<{ state: string; count: number }>;
  };
  trends: {
    monthlyLoans: Array<{ month: string; count: number }>;
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

const COLORS = ["#ea580c", "#2563eb", "#16a34a", "#9333ea", "#dc2626", "#ca8a04"];

export function Dashboard({ className }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "tenants" | "users" | "banks" | "officers">("overview");
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, [activeTab]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError("");
    try {
      // Fetch analytics data
      const analyticsResponse = await fetch("/api/analytics", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const analyticsData = await analyticsResponse.json();
      
      if (analyticsData.success) {
        setAnalytics(analyticsData.data);
      }

      // Fetch tenants if needed
      if (activeTab === "tenants" || activeTab === "overview") {
        const response = await fetch("/api/tenant", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        
        if (data.success) {
          setTenants(data.data || []);
        } else {
          setError(data.message || "Failed to fetch data");
        }
      }
    } catch (err) {
      setError("Error fetching dashboard data");
      console.error(err);
    } finally {
      setLoading(false);
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

  const statsCards: StatsCard[] = [
    {
      title: "Total Loans",
      value: analytics?.loans.total || 0,
      subtitle: `${analytics?.loans.byStatus.approved || 0} Approved`,
      icon: <IconFileAnalytics className="h-6 w-6" />,
      color: "from-orange-500 to-orange-600",
      loading,
    },
    {
      title: "Total Users",
      value: analytics?.overview.totalUsers || 0,
      subtitle: `${analytics?.overview.verifiedUsers || 0} Verified`,
      icon: <IconUsers className="h-6 w-6" />,
      color: "from-blue-500 to-blue-600",
      loading,
    },
    {
      title: "Loan Amount",
      value: analytics ? formatCurrency(analytics.loans.totalSanctionAmount) : "₹0",
      subtitle: `Avg: ${analytics ? formatCurrency(analytics.loans.averageLoanAmount) : "₹0"}`,
      icon: <IconCurrencyRupee className="h-6 w-6" />,
      color: "from-green-500 to-green-600",
      loading,
    },
    {
      title: "Banks & Officers",
      value: `${analytics?.overview.totalBanks || 0} / ${analytics?.overview.totalStateOfficers || 0}`,
      subtitle: `${analytics?.overview.totalTenants || 0} States`,
      icon: <IconBuildingBank className="h-6 w-6" />,
      color: "from-purple-500 to-purple-600",
      loading,
    },
  ];

  const filteredTenants = tenants.filter(
    (tenant) =>
      tenant.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.state?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={cn("flex flex-1 flex-col overflow-auto", className)}>
      <div className="flex w-full flex-col gap-4 rounded-tl-2xl border border-neutral-200 bg-white p-4 md:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-neutral-200">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-sm text-neutral-600 mt-1">
              Manage your LoanSetu platform
            </p>
          </div>
          <button
            onClick={fetchDashboardData}
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
                    <p className="text-sm text-neutral-600">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold text-neutral-900 mt-2">
                      {stat.loading ? (
                        <span className="animate-pulse">--</span>
                      ) : (
                        stat.value
                      )}
                    </p>
                    {stat.subtitle && (
                      <p className="text-xs text-neutral-500 mt-1">
                        {stat.subtitle}
                      </p>
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
      {/* Tabs */}
      <div className="mt-1 pt-2 border-t border-neutral-200 flex gap-2 overflow-x-auto pb-2">
          {["overview", "tenants", "users", "banks", "officers"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={cn(
                "px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all",
                activeTab === tab
                  ? "bg-orange-600 text-white shadow-lg"
                  : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              )}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-50 text-red-600">
            {error}
          </div>
        )}

        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-10">
            {/* Loan Status Pie Chart */}
            <div className="rounded-xl border border-neutral-200 bg-white p-6 min-h-[360px]">
              <h3 className="text-lg font-semibold mb-4">Loan Status Distribution</h3>
              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-pulse text-neutral-400">Loading...</div>
                </div>
              ) : analytics ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Pending", value: analytics.loans.byStatus.pending },
                        { name: "Under Review", value: analytics.loans.byStatus.underReview },
                        { name: "Approved", value: analytics.loans.byStatus.approved },
                        { name: "Rejected", value: analytics.loans.byStatus.rejected },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[0, 1, 2, 3].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-neutral-600 text-sm text-center py-8">No data available</p>
              )}
            </div>

            {/* Monthly Loan Trend */}
            <div className="rounded-xl border border-neutral-200 bg-white p-6 min-h-[360px]">
              <h3 className="text-lg font-semibold mb-4">Loan Submissions Trend (6 Months)</h3>
              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-pulse text-neutral-400">Loading...</div>
                </div>
              ) : analytics ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.trends.monthlyLoans}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#ea580c" 
                      strokeWidth={2}
                      name="Loans Submitted"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-neutral-600 text-sm text-center py-8">No data available</p>
              )}
            </div>

            {/* Loans by Bank */}
            <div className="rounded-xl border border-neutral-200 bg-white p-6">
              <h3 className="text-lg font-semibold mb-4">Top Banks by Loan Count</h3>
              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-pulse text-neutral-400">Loading...</div>
                </div>
              ) : analytics ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.distribution.loansByBankName.slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#16a34a" name="Loans Processed" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-neutral-600 text-sm text-center py-8">No data available</p>
              )}
            </div>

            {/* Loans by State */}
            <div className="rounded-xl border border-neutral-200 bg-white p-6">
              <h3 className="text-lg font-semibold mb-4">Loans by State</h3>
              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-pulse text-neutral-400">Loading...</div>
                </div>
              ) : analytics ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.distribution.loansByState.slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="state" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#2563eb" name="Total Loans" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-neutral-600 text-sm text-center py-8">No data available</p>
              )}
            </div>

            {/* Disbursement Mode Distribution */}
            <div className="rounded-xl border border-neutral-200 bg-white p-6">
              <h3 className="text-lg font-semibold mb-4">Disbursement Mode Distribution</h3>
              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-pulse text-neutral-400">Loading...</div>
                </div>
              ) : analytics ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Full", value: analytics.loans.byDisbursementMode.full },
                        { name: "Installments", value: analytics.loans.byDisbursementMode.installments },
                        { name: "Vendor Payment", value: analytics.loans.byDisbursementMode.vendorPayment },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[0, 1, 2].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-neutral-600 text-sm text-center py-8">No data available</p>
              )}
            </div>

            {/* Recent Loans */}
            <div className="rounded-xl border border-neutral-200 bg-white p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Loan Submissions</h3>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-16 animate-pulse rounded-lg bg-neutral-200" />
                  ))}
                </div>
              ) : analytics && analytics.loans.recentLoans.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {analytics.loans.recentLoans.map((loan, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 hover:bg-neutral-100 transition-colors">
                      <div className="flex-1">
                        <p className="font-medium text-sm text-neutral-900">{loan.loanNumber}</p>
                        <p className="text-xs text-neutral-600">
                          {new Date(loan.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm text-neutral-900">
                          {formatCurrency(loan.sanctionAmount)}
                        </p>
                        <span
                          className={cn(
                            "inline-flex px-2 py-1 text-xs font-medium rounded-full",
                            loan.status === "APPROVED"
                              ? "bg-green-100 text-green-800"
                              : loan.status === "REJECTED"
                              ? "bg-red-100 text-red-800"
                              : loan.status === "UNDER_REVIEW"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-orange-100 text-orange-800"
                          )}
                        >
                          {loan.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-neutral-600 text-sm text-center py-8">No recent loans</p>
              )}
            </div>

            {/* AI Analytics Dashboard */}
            {analytics && (
              <div className="lg:col-span-2 rounded-xl border border-neutral-200 bg-white p-6">
                <h3 className="text-lg font-semibold mb-4">AI Decision Analytics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart
                        data={[
                          { name: "Auto Approve", value: analytics.ai.decisions.autoApprove },
                          { name: "Auto Review", value: analytics.ai.decisions.autoReview },
                          { name: "High Risk", value: analytics.ai.decisions.autoHighRisk },
                          { name: "Not Processed", value: analytics.ai.decisions.notProcessed },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-20} textAnchor="end" height={80} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#9333ea" name="Count" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col justify-center space-y-4">
                    <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100">
                      <p className="text-sm text-purple-700 font-medium">Average AI Risk Score</p>
                      <p className="text-4xl font-bold text-purple-900 mt-2">
                        {analytics.ai.averageRiskScore.toFixed(1)}
                        <span className="text-xl text-purple-600">/100</span>
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                        <p className="text-xs text-green-700">Auto Approved</p>
                        <p className="text-2xl font-bold text-green-900">
                          {analytics.ai.decisions.autoApprove}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                        <p className="text-xs text-red-700">High Risk</p>
                        <p className="text-2xl font-bold text-red-900">
                          {analytics.ai.decisions.autoHighRisk}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "tenants" && (
          <div className="flex flex-col gap-4 pb-8">
            {/* Search */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search tenants..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-auto rounded-xl border border-neutral-200 max-h-[600px]">
              <table className="w-full">
                <thead className="bg-neutral-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase">
                      Code
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase">
                      State
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={5} className="px-4 py-4">
                          <div className="h-8 animate-pulse rounded bg-neutral-200" />
                        </td>
                      </tr>
                    ))
                  ) : filteredTenants.length > 0 ? (
                    filteredTenants.map((tenant) => (
                      <tr
                        key={tenant._id}
                        className="hover:bg-neutral-50 transition-colors"
                      >
                        <td className="px-4 py-4 text-sm font-medium text-neutral-900">
                          {tenant.code}
                        </td>
                        <td className="px-4 py-4 text-sm text-neutral-600">
                          {tenant.name}
                        </td>
                        <td className="px-4 py-4 text-sm text-neutral-600">
                          {tenant.state}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={cn(
                              "inline-flex px-2 py-1 text-xs font-medium rounded-full",
                              tenant.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            )}
                          >
                            {tenant.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <button
                            className="p-1 rounded hover:bg-neutral-100 transition-colors"
                            title="Edit"
                          >
                            <IconEdit className="h-4 w-4 text-blue-600" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-neutral-600">
                        No tenants found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {(activeTab === "users" || activeTab === "banks" || activeTab === "officers") && (
          <div className="flex items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50 min-h-[400px] mb-8">
            <div className="text-center p-8">
              <p className="text-neutral-600 text-lg">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} management coming soon
              </p>
              <p className="text-neutral-500 text-sm mt-2">
                API endpoints and UI will be available in the next update
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
