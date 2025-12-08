"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconFileCode,
  IconPlus,
  IconEdit,
  IconSearch,
  IconRefresh,
  IconEye,
} from "@tabler/icons-react";
import { cn } from "../../../lib/utils";
import { AdminSidebar } from "../../../components/admin/AdminSidebar";

interface RuleSet {
  _id: string;
  name: string;
  description?: string;
  tenantId: string;
  version: number;
  isActive: boolean;
  isApplicableToAll: boolean;
  rules: any;
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

export default function RuleSetsPage() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rulesets, setRulesets] = useState<RuleSet[]>([]);
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
      fetchRuleSets();
    } catch (error) {
      console.error("Session validation error:", error);
      router.push("/admin/signin");
    }
  };

  const fetchRuleSets = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/rullset", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();

      if (data.success) {
        setRulesets(data.data || []);
      } else {
        setError(data.message || "Failed to fetch rulesets");
      }
    } catch (err) {
      setError("Error fetching rulesets");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredRuleSets = rulesets.filter(
    (ruleset) =>
      ruleset.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ruleset.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!adminData) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full flex-1 flex-col overflow-hidden bg-white md:flex-row h-screen">
      <AdminSidebar open={open} setOpen={setOpen} adminData={adminData} />
      
      <div className="flex flex-1 flex-col overflow-auto">
        <div className="flex w-full flex-col gap-4 rounded-tl-2xl border border-neutral-200 bg-white p-4 md:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-neutral-200">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                Rule Sets
              </h1>
              <p className="text-sm text-neutral-600 mt-1">
                Manage verification rules and policies
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchRuleSets}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors"
              >
                <IconRefresh className="h-4 w-4" />
                Refresh
              </button>
              <button
                onClick={() => router.push("/admin/rulesets/add")}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors"
              >
                <IconPlus className="h-4 w-4" />
                Add RuleSet
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search rulesets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 rounded-lg bg-red-50 text-red-600">
              {error}
            </div>
          )}

          {/* Table */}
          <div className="overflow-auto rounded-xl border border-neutral-200">
            <table className="w-full">
              <thead className="bg-neutral-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase">
                    Version
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase">
                    Actions
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
                ) : filteredRuleSets.length > 0 ? (
                  filteredRuleSets.map((ruleset) => (
                    <tr
                      key={ruleset._id}
                      className="hover:bg-neutral-50 transition-colors"
                    >
                      <td className="px-4 py-4 text-sm font-medium text-neutral-900">
                        {ruleset.name}
                      </td>
                      <td className="px-4 py-4 text-sm text-neutral-600 max-w-xs truncate">
                        {ruleset.description || "—"}
                      </td>
                      <td className="px-4 py-4 text-sm text-neutral-600">
                        v{ruleset.version}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={cn(
                            "inline-flex px-2 py-1 text-xs font-medium rounded-full",
                            ruleset.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          )}
                        >
                          {ruleset.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => router.push(`/admin/rulesets/view/${ruleset._id}`)}
                            className="p-1 rounded hover:bg-neutral-100 transition-colors"
                            title="View"
                          >
                            <IconEye className="h-4 w-4 text-blue-600" />
                          </button>
                          <button
                            onClick={() => router.push(`/admin/rulesets/edit/${ruleset._id}`)}
                            className="p-1 rounded hover:bg-neutral-100 transition-colors"
                            title="Edit"
                          >
                            <IconEdit className="h-4 w-4 text-orange-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-neutral-600">
                      No rulesets found
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
