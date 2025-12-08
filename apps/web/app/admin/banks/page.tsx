"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconBuildingBank,
  IconPlus,
  IconEdit,
  IconSearch,
  IconRefresh,
} from "@tabler/icons-react";
import { cn } from "../../../lib/utils";
import { AdminSidebar } from "../../../components/admin/AdminSidebar";

interface Bank {
  _id: string;
  name: string;
  branchName: string;
  ifsc: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  state: string;
  district: string;
  tenantId: string;
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
  tenantId: string;
}

export default function BankOfficersPage() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [banks, setBanks] = useState<Bank[]>([]);
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
      fetchBanks();
    } catch (error) {
      console.error("Session validation error:", error);
      router.push("/admin/signin");
    }
  };

  const fetchBanks = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/bankauth", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      const data = await response.json();
      
      if (data.success) {
        setBanks(data.data || []);
      } else {
        setError(data.message || "Failed to fetch bank officers");
      }
    } catch (err) {
      setError("Error fetching bank officers");
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

  const filteredBanks = banks.filter(
    (bank) =>
      bank.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bank.branchName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bank.ifsc?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bank.contactName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bank.state?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bank.district?.toLowerCase().includes(searchQuery.toLowerCase())
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
                Bank Officers Management
              </h1>
              <p className="text-sm text-neutral-600 mt-1">
                {adminData?.isSuperAdmin 
                  ? "View and manage all bank officers across all states"
                  : `Manage bank officers for ${adminData?.state}`}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchBanks}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors"
              >
                <IconRefresh className="h-4 w-4" />
                Refresh
              </button>
              <button
                onClick={() => router.push("/admin/banks/add")}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors whitespace-nowrap"
              >
                <IconPlus className="h-4 w-4" />
                Add Bank Officer
              </button>
            </div>
          </div>

          {/* Alert Messages */}
          {error && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-600">
              {error}
            </div>
          )}

          {!adminData?.isSuperAdmin && (
            <div className="p-4 rounded-lg bg-orange-50 border border-orange-200 text-orange-600">
              You can only manage bank officers for your assigned state ({adminData?.state}).
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200">
              <p className="text-sm font-medium text-orange-600">Total Banks</p>
              <p className="text-2xl font-bold text-orange-700 mt-1">{banks.length}</p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
              <p className="text-sm font-medium text-green-600">Active Banks</p>
              <p className="text-2xl font-bold text-green-700 mt-1">
                {banks.filter((b) => b.isActive).length}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-red-50 to-red-100 border border-red-200">
              <p className="text-sm font-medium text-red-600">Inactive Banks</p>
              <p className="text-2xl font-bold text-red-700 mt-1">
                {banks.filter((b) => !b.isActive).length}
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by bank name, branch, IFSC, contact, state, or district..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* Bank Officers Table */}
          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-neutral-600">Loading bank officers...</p>
                </div>
              </div>
            ) : filteredBanks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <IconBuildingBank className="h-16 w-16 text-neutral-300 mb-4" />
                <p className="text-lg font-medium text-neutral-600 mb-2">
                  {searchQuery ? "No bank officers found" : "No bank officers yet"}
                </p>
                <p className="text-sm text-neutral-500 mb-6">
                  {searchQuery
                    ? "Try adjusting your search criteria"
                    : "Get started by adding your first bank officer"}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => router.push("/admin/banks/add")}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors"
                  >
                    <IconPlus className="h-4 w-4" />
                    Add Bank Officer
                  </button>
                )}
              </div>
            ) : (
              <div className="border border-neutral-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-orange-900">Bank Name</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-orange-900">Branch</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-orange-900">IFSC Code</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-orange-900">Contact Person</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-orange-900">Location</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-orange-900">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-orange-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBanks.map((bank) => (
                      <tr key={bank._id} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <IconBuildingBank className="h-5 w-5 text-orange-600" />
                            <span className="font-medium text-neutral-900">{bank.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-neutral-700">{bank.branchName}</td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-sm bg-neutral-100 px-2 py-1 rounded">
                            {bank.ifsc}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-neutral-900 font-medium">{bank.contactName}</p>
                            <p className="text-xs text-neutral-500">{bank.contactEmail}</p>
                            <p className="text-xs text-neutral-500">{bank.contactPhone}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-neutral-900">{bank.state}</p>
                            <p className="text-xs text-neutral-500">{bank.district}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={cn(
                              "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                              bank.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            )}
                          >
                            {bank.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => router.push(`/admin/banks/edit/${bank._id}`)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors text-sm"
                          >
                            <IconEdit className="h-4 w-4" />
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
