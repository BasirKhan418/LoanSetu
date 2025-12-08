"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconBuilding,
  IconPlus,
  IconEdit,
  IconSearch,
  IconRefresh,
} from "@tabler/icons-react";
import { cn } from "../../../lib/utils";
import { AdminSidebar } from "../../../components/admin/AdminSidebar";

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

interface AdminData {
  name: string;
  email: string;
  img?: string;
  state?: string;
  isVerified: boolean;
  isActive: boolean;
  isSuperAdmin: boolean;
}

export default function TenantsPage() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [adminData, setAdminData] = useState<AdminData | null>(null);

  useEffect(() => {
    validateAdminSession();
  }, []);

  const validateAdminSession = async () => {
    try {
      

      const response = await fetch("/api/verify", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", 
      });

      const data = await response.json();

      if (!data.success || data.type !== "admin") {
        document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
        router.push("/admin/signin");
        return;
      }

      if (!data.data.isVerified) {
        router.push("/admin/signin?error=not-verified");
        return;
      }

      if (!data.data.isActive) {
        router.push("/admin/signin?error=account-deactivated");
        return;
      }

      setAdminData(data.data);
      fetchTenants();
    } catch (error) {
      console.error("Session validation error:", error);
      router.push("/admin/signin");
    }
  };

  const fetchTenants = async () => {
    setLoading(true);
    setError("");
    try {
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
        setError(data.message || "Failed to fetch tenants");
      }
    } catch (err) {
      setError("Error fetching tenants");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getCookie = (name: string): string | null => {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
    return null;
  };

  const filteredTenants = tenants.filter(
    (tenant) =>
      tenant.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.state?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && !adminData) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-600 font-medium">Verifying session...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mx-auto flex w-full flex-1 flex-col overflow-hidden bg-white md:flex-row",
        "h-screen"
      )}
    >
      <AdminSidebar open={open} setOpen={setOpen} adminData={adminData || undefined} />
      <div className="flex flex-1 flex-col">
        <div className="flex h-full w-full flex-1 flex-col gap-4 rounded-tl-2xl border border-neutral-200 bg-white p-4 md:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-neutral-200">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                Tenant Management
              </h1>
              <p className="text-sm text-neutral-600 mt-1">
                View and manage all tenants in the system
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchTenants}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors"
              >
                <IconRefresh className="h-4 w-4" />
                Refresh
              </button>
              {adminData?.isSuperAdmin && (
                <button
                  onClick={() => router.push("/admin/tenants/add")}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors whitespace-nowrap"
                >
                  <IconPlus className="h-4 w-4" />
                  Add Tenant
                </button>
              )}
            </div>
          </div>

          {/* Alert Messages */}
          {error && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-600">
              {error}
            </div>
          )}

          {!adminData?.isSuperAdmin && (
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 text-blue-700">
              <p className="font-medium">View Only Mode</p>
              <p className="text-sm mt-1">Only super admins can add new tenants to the system.</p>
            </div>
          )}

          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search tenants by name, code, or state..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Tenant Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-lg border border-neutral-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-orange-100">
                  <IconBuilding className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Total Tenants</p>
                  <p className="text-2xl font-bold text-neutral-900">{tenants.length}</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-green-100">
                  <IconBuilding className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Active</p>
                  <p className="text-2xl font-bold text-neutral-900">
                    {tenants.filter((t) => t.isActive).length}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-red-100">
                  <IconBuilding className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Inactive</p>
                  <p className="text-2xl font-bold text-neutral-900">
                    {tenants.filter((t) => !t.isActive).length}
                  </p>
                </div>
              </div>
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
                    District
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
                      <td colSpan={6} className="px-4 py-4">
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
                      <td className="px-4 py-4 text-sm text-neutral-600">
                        {tenant.district || "-"}
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
                        {adminData?.isSuperAdmin ? (
                          <button
                            onClick={() => router.push(`/admin/tenants/edit/${tenant._id}`)}
                            className="p-1 rounded hover:bg-neutral-100 transition-colors"
                            title="Edit"
                          >
                            <IconEdit className="h-4 w-4 text-blue-600" />
                          </button>
                        ) : (
                          <span className="text-xs text-neutral-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-neutral-600">
                      {searchQuery ? "No tenants found matching your search" : "No tenants found"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
