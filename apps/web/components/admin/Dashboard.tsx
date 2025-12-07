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
} from "@tabler/icons-react";
import { cn } from "../../lib/utils";

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
  value: number;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
}

export function Dashboard({ className }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "tenants" | "users" | "banks" | "officers">("overview");
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({
    totalTenants: 0,
    totalUsers: 0,
    totalBanks: 0,
    totalOfficers: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, [activeTab]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError("");
    try {
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
          setStats(prev => ({ ...prev, totalTenants: data.data?.length || 0 }));
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



  const statsCards: StatsCard[] = [
    {
      title: "Total Tenants",
      value: stats.totalTenants,
      icon: <IconBuilding className="h-6 w-6" />,
      color: "from-orange-500 to-orange-600",
      loading,
    },
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: <IconUsers className="h-6 w-6" />,
      color: "from-blue-500 to-blue-600",
      loading,
    },
    {
      title: "Total Banks",
      value: stats.totalBanks,
      icon: <IconBuildingBank className="h-6 w-6" />,
      color: "from-green-500 to-green-600",
      loading,
    },
    {
      title: "State Officers",
      value: stats.totalOfficers,
      icon: <IconUserShield className="h-6 w-6" />,
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
    <div className={cn("flex flex-1 flex-col", className)}>
      <div className="flex h-full w-full flex-1 flex-col gap-4 rounded-tl-2xl border border-neutral-200 bg-white p-4 md:p-8">
=        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-neutral-200">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsCards.map((stat, idx) => (
            <div
              key={idx}
              className="relative overflow-hidden rounded-xl bg-gradient-to-br p-[1px] shadow-lg"
            >
              <div className={cn("absolute inset-0 bg-gradient-to-br", stat.color)} />
              <div className="relative rounded-xl bg-white p-6 backdrop-blur">
                <div className="flex items-center justify-between">
                  <div>
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
        <div className="flex gap-2 overflow-x-auto pb-2">
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

        {/* Content Area */}
        {error && (
          <div className="p-4 rounded-lg bg-red-50 text-red-600">
            {error}
          </div>
        )}

        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
            <div className="h-full rounded-xl border border-neutral-200 bg-white p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-16 animate-pulse rounded-lg bg-neutral-200" />
                  ))
                ) : (
                  <p className="text-neutral-600 text-sm">
                    No recent activity
                  </p>
                )}
              </div>
            </div>
            <div className="h-full rounded-xl border border-neutral-200 bg-white p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <button className="p-4 rounded-lg bg-white border border-neutral-200 hover:border-orange-500 transition-colors">
                  <IconUsers className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                  <p className="text-sm font-medium">Add User</p>
                </button>
                <button className="p-4 rounded-lg bg-white border border-neutral-200 hover:border-orange-500 transition-colors">
                  <IconBuildingBank className="h-6 w-6 mx-auto mb-2 text-green-600" />
                  <p className="text-sm font-medium">Add Bank</p>
                </button>
                <button className="p-4 rounded-lg bg-white border border-neutral-200 hover:border-orange-500 transition-colors">
                  <IconUserShield className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                  <p className="text-sm font-medium">Add Officer</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "tenants" && (
          <div className="flex-1 flex flex-col gap-4">
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
            <div className="flex-1 overflow-auto rounded-xl border border-neutral-200">
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
          <div className="flex-1 flex items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50">
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
