"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconAlertTriangle,
  IconSearch,
  IconRefresh,
  IconEye,
} from "@tabler/icons-react";
import { cn } from "../../../lib/utils";
import { AdminSidebar } from "../../../components/admin/AdminSidebar";

interface ConflictData {
  _id: string;
  submissionId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    status: string;
    reviewDecision?: string;
    aiSummary?: {
      decision: string;
      reason?: string;
    };
  };
  officerId: {
    _id: string;
    name: string;
    email: string;
  };
  tenantId: {
    _id: string;
    name: string;
    code: string;
    state: string;
  };
  conflictDetected: boolean;
  sentimentScore: number;
  aiReason?: string;
  officerRemarks?: string;
  createdAt: string;
}

interface AdminData {
  name: string;
  email: string;
  img?: string;
  state?: string;
  isVerified: boolean;
  isActive: boolean;
}

export default function ConflictsPage() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [conflicts, setConflicts] = useState<ConflictData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [selectedConflict, setSelectedConflict] = useState<ConflictData | null>(null);
  const [showDetails, setShowDetails] = useState(false);

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
        document.cookie =
          "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
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
      fetchConflicts();
    } catch (error) {
      console.error("Session validation error:", error);
      router.push("/admin/signin");
    }
  };

  const fetchConflicts = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/conflicts", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();

      if (data.success) {
        setConflicts(data.data || []);
      } else {
        setError(data.message || "Failed to fetch conflicts");
      }
    } catch (error) {
      console.error("Error fetching conflicts:", error);
      setError("Error fetching conflicts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filteredConflicts = conflicts.filter((conflict) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      conflict.submissionId?.name?.toLowerCase().includes(searchLower) ||
      conflict.submissionId?.email?.toLowerCase().includes(searchLower) ||
      conflict.officerId?.name?.toLowerCase().includes(searchLower) ||
      conflict.tenantId?.name?.toLowerCase().includes(searchLower) ||
      conflict.tenantId?.state?.toLowerCase().includes(searchLower)
    );
  });

  const getDecisionBadgeColor = (decision?: string) => {
    switch (decision?.toLowerCase()) {
      case "approve":
      case "approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "reject":
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      case "needresubmit":
      case "need resubmit":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getSentimentColor = (score: number) => {
    if (score <= 3) return "text-red-600";
    if (score <= 5) return "text-yellow-600";
    if (score <= 7) return "text-blue-600";
    return "text-green-600";
  };

  const viewDetails = (conflict: ConflictData) => {
    setSelectedConflict(conflict);
    setShowDetails(true);
  };

  return (
    <div
      className={cn(
        "flex h-screen w-full flex-col bg-gray-50 md:flex-row",
        "overflow-hidden"
      )}
    >
      <AdminSidebar open={open} setOpen={setOpen} adminData={adminData || undefined} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <IconAlertTriangle className="h-8 w-8 text-orange-600" />
                <h1 className="text-3xl font-bold text-gray-900">
                  Conflict of Interest
                </h1>
              </div>
              <p className="text-gray-600">
                Monitor conflicts between AI and officer decisions
              </p>
            </div>

            {/* Search and Actions */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-md">
                <IconSearch className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or state..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <button
                onClick={fetchConflicts}
                disabled={loading}
                className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-white hover:bg-orange-700 disabled:opacity-50"
              >
                <IconRefresh className={cn("h-5 w-5", loading && "animate-spin")} />
                Refresh
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
              </div>
            )}

            {/* Conflicts Count */}
            {!loading && (
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Showing {filteredConflicts.length} of {conflicts.length} conflicts
                </p>
              </div>
            )}

            {/* Conflicts Table */}
            {!loading && filteredConflicts.length > 0 && (
              <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Applicant
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tenant
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Officer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          AI Decision
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Officer Decision
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sentiment
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredConflicts.map((conflict) => (
                        <tr key={conflict._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <div className="text-sm font-medium text-gray-900">
                                {conflict.submissionId?.name || "N/A"}
                              </div>
                              <div className="text-sm text-gray-500">
                                {conflict.submissionId?.email || "N/A"}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <div className="text-sm font-medium text-gray-900">
                                {conflict.tenantId?.name || "N/A"}
                              </div>
                              <div className="text-sm text-gray-500">
                                {conflict.tenantId?.state || "N/A"}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {conflict.officerId?.name || "N/A"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={cn(
                                "inline-flex px-2 py-1 text-xs font-semibold rounded-full border",
                                getDecisionBadgeColor(
                                  conflict.submissionId?.aiSummary?.decision
                                )
                              )}
                            >
                              {conflict.submissionId?.aiSummary?.decision || "N/A"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={cn(
                                "inline-flex px-2 py-1 text-xs font-semibold rounded-full border",
                                getDecisionBadgeColor(
                                  conflict.submissionId?.reviewDecision
                                )
                              )}
                            >
                              {conflict.submissionId?.reviewDecision || "N/A"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={cn(
                                "text-sm font-semibold",
                                getSentimentColor(conflict.sentimentScore)
                              )}
                            >
                              {conflict.sentimentScore}/10
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(conflict.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => viewDetails(conflict)}
                              className="text-orange-600 hover:text-orange-900 flex items-center gap-1"
                            >
                              <IconEye className="h-4 w-4" />
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* No Conflicts */}
            {!loading && filteredConflicts.length === 0 && (
              <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center">
                <IconAlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">
                  No conflicts found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchQuery
                    ? "Try adjusting your search query"
                    : "No conflicts of interest detected yet"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {showDetails && selectedConflict && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center px-4">
            <div
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={() => setShowDetails(false)}
            ></div>
            <div className="relative bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">
                  Conflict Details
                </h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="px-6 py-4 space-y-6">
                {/* Applicant Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Applicant Information
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">Name:</span>{" "}
                      {selectedConflict.submissionId?.name}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Email:</span>{" "}
                      {selectedConflict.submissionId?.email}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Phone:</span>{" "}
                      {selectedConflict.submissionId?.phone}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Status:</span>{" "}
                      <span className="capitalize">
                        {selectedConflict.submissionId?.status}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Tenant Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Tenant Information
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">Name:</span>{" "}
                      {selectedConflict.tenantId?.name}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Code:</span>{" "}
                      {selectedConflict.tenantId?.code}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">State:</span>{" "}
                      {selectedConflict.tenantId?.state}
                    </p>
                  </div>
                </div>

                {/* Officer Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Officer Information
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">Name:</span>{" "}
                      {selectedConflict.officerId?.name}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Email:</span>{" "}
                      {selectedConflict.officerId?.email}
                    </p>
                  </div>
                </div>

                {/* Decisions Comparison */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Decisions Comparison
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        AI Decision
                      </p>
                      <span
                        className={cn(
                          "inline-flex px-3 py-1 text-sm font-semibold rounded-full border",
                          getDecisionBadgeColor(
                            selectedConflict.submissionId?.aiSummary?.decision
                          )
                        )}
                      >
                        {selectedConflict.submissionId?.aiSummary?.decision ||
                          "N/A"}
                      </span>
                      {selectedConflict.submissionId?.aiSummary?.reason && (
                        <p className="text-sm text-gray-600 mt-3">
                          <span className="font-medium">Reason:</span>{" "}
                          {selectedConflict.submissionId.aiSummary.reason}
                        </p>
                      )}
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Officer Decision
                      </p>
                      <span
                        className={cn(
                          "inline-flex px-3 py-1 text-sm font-semibold rounded-full border",
                          getDecisionBadgeColor(
                            selectedConflict.submissionId?.reviewDecision
                          )
                        )}
                      >
                        {selectedConflict.submissionId?.reviewDecision || "N/A"}
                      </span>
                      {selectedConflict.officerRemarks && (
                        <p className="text-sm text-gray-600 mt-3">
                          <span className="font-medium">Remarks:</span>{" "}
                          {selectedConflict.officerRemarks}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* AI Analysis */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    AI Conflict Analysis
                  </h3>
                  <div className="bg-yellow-50 rounded-lg p-4 space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Conflict Detected:{" "}
                      </span>
                      <span
                        className={cn(
                          "text-sm font-semibold",
                          selectedConflict.conflictDetected
                            ? "text-red-600"
                            : "text-green-600"
                        )}
                      >
                        {selectedConflict.conflictDetected ? "YES" : "NO"}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Sentiment Score:{" "}
                      </span>
                      <span
                        className={cn(
                          "text-sm font-semibold",
                          getSentimentColor(selectedConflict.sentimentScore)
                        )}
                      >
                        {selectedConflict.sentimentScore}/10
                      </span>
                    </div>
                    {selectedConflict.aiReason && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          AI Reasoning:
                        </p>
                        <p className="text-sm text-gray-600">
                          {selectedConflict.aiReason}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Timestamp */}
                <div className="text-sm text-gray-500 text-right">
                  Detected on:{" "}
                  {new Date(selectedConflict.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
