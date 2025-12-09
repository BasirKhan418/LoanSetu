"use client";

import React, { useEffect, useState } from "react";
import { AdminSidebar } from "../../../components/admin/AdminSidebar";
import {
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconFilter,
  IconDownload,
} from "@tabler/icons-react";

interface ConflictData {
  _id: string;
  loanNumber: string;
  beneficiaryName: string;
  beneficiaryPhone: string;
  bankName: string;
  officerName: string;
  officerEmail: string;
  aiDecision: string;
  aiRiskScore: number;
  aiFlags: string[];
  officerDecision: string;
  officerRemarks: string;
  reviewedAt: string;
  submissionType: string;
  status: string;
  createdAt: string;
  conflictType: string;
}

export default function ConflictsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [conflicts, setConflicts] = useState<ConflictData[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [conflictFilter, setConflictFilter] = useState("all");
  const [adminData, setAdminData] = useState<any>(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  useEffect(() => {
    fetchConflicts();
  }, [page, conflictFilter]);

  const fetchAdminData = async () => {
    try {
      const response = await fetch("/api/me");
      if (response.ok) {
        const data = await response.json();
        setAdminData(data.admin);
      }
    } catch (error) {
      console.error("Error fetching admin data:", error);
    }
  };

  const fetchConflicts = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/conflicts?page=${page}&limit=20&conflictType=${conflictFilter}`
      );
      const data = await response.json();

      if (data.success) {
        setConflicts(data.data);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
      }
    } catch (error) {
      console.error("Error fetching conflicts:", error);
    } finally {
      setLoading(false);
    }
  };

  const getConflictBadgeColor = (conflictType: string) => {
    switch (conflictType) {
      case "AI_APPROVE_OFFICER_REJECT":
        return "bg-red-100 text-red-800";
      case "AI_REJECT_OFFICER_APPROVE":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getConflictDescription = (conflictType: string) => {
    switch (conflictType) {
      case "AI_APPROVE_OFFICER_REJECT":
        return "AI Approved but Officer Rejected";
      case "AI_REJECT_OFFICER_APPROVE":
        return "AI Rejected but Officer Approved";
      default:
        return "Other Conflict";
    }
  };

  const getDecisionIcon = (decision: string) => {
    if (decision === "APPROVED" || decision === "AUTO_APPROVE") {
      return <IconCheck className="h-4 w-4 text-green-600" />;
    }
    return <IconX className="h-4 w-4 text-red-600" />;
  };

  const exportConflicts = () => {
    // Create CSV content
    const headers = [
      "Loan Number",
      "Beneficiary",
      "Bank",
      "Officer",
      "AI Decision",
      "AI Risk Score",
      "Officer Decision",
      "Conflict Type",
      "Reviewed At",
    ];
    
    const csvContent = [
      headers.join(","),
      ...conflicts.map((c) =>
        [
          c.loanNumber,
          c.beneficiaryName,
          c.bankName,
          c.officerName,
          c.aiDecision,
          c.aiRiskScore || "N/A",
          c.officerDecision,
          getConflictDescription(c.conflictType),
          new Date(c.reviewedAt).toLocaleDateString(),
        ].join(",")
      ),
    ].join("\n");

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `conflicts-${new Date().toISOString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-50">
      <AdminSidebar
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        adminData={adminData}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Conflict of Interest Monitor
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Track conflicts between AI and human decisions
              </p>
            </div>
            <button
              onClick={exportConflicts}
              className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-white hover:bg-orange-700 transition-colors"
            >
              <IconDownload className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="border-b bg-white px-6 py-3">
          <div className="flex items-center gap-4">
            <IconFilter className="h-5 w-5 text-gray-500" />
            <select
              value={conflictFilter}
              onChange={(e) => {
                setConflictFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
            >
              <option value="all">All Conflicts</option>
              <option value="ai-approve-officer-reject">
                AI Approved, Officer Rejected
              </option>
              <option value="ai-reject-officer-approve">
                AI Rejected, Officer Approved
              </option>
              <option value="ai-needresubmit-officer-approve">
                AI Need Resubmission, Officer Approved
              </option>
            </select>
            <span className="text-sm text-gray-600">
              Total Conflicts: <span className="font-semibold">{total}</span>
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading conflicts...</p>
              </div>
            </div>
          ) : conflicts.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <IconAlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Conflicts Found
                </h3>
                <p className="text-gray-600">
                  There are no conflicts of interest in the system.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid gap-4">
                {conflicts.map((conflict) => (
                  <div
                    key={conflict._id}
                    className="rounded-lg border bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Loan #{conflict.loanNumber}
                          </h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getConflictBadgeColor(
                              conflict.conflictType
                            )}`}
                          >
                            {getConflictDescription(conflict.conflictType)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Beneficiary: {conflict.beneficiaryName} (
                          {conflict.beneficiaryPhone})
                        </p>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <p>
                          Reviewed:{" "}
                          {new Date(conflict.reviewedAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs mt-1">
                          {new Date(conflict.reviewedAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* AI Decision */}
                      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                            AI
                          </div>
                          <h4 className="font-semibold text-gray-900">
                            AI Decision
                          </h4>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">
                              Decision:
                            </span>
                            <div className="flex items-center gap-2">
                              {getDecisionIcon(conflict.aiDecision)}
                              <span className="font-medium text-sm">
                                {conflict.aiDecision}
                              </span>
                            </div>
                          </div>
                          {conflict.aiRiskScore !== null && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-700">
                                Risk Score:
                              </span>
                              <span className="font-medium text-sm">
                                {conflict.aiRiskScore}/100
                              </span>
                            </div>
                          )}
                          {conflict.aiFlags && conflict.aiFlags.length > 0 && (
                            <div>
                              <span className="text-sm text-gray-700 block mb-1">
                                Flags:
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {conflict.aiFlags.map((flag, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                                  >
                                    {flag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Officer Decision */}
                      <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm">
                            {conflict.officerName?.charAt(0).toUpperCase() ||
                              "O"}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              Officer Decision
                            </h4>
                            <p className="text-xs text-gray-600">
                              {conflict.officerName}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">
                              Decision:
                            </span>
                            <div className="flex items-center gap-2">
                              {getDecisionIcon(conflict.officerDecision)}
                              <span className="font-medium text-sm">
                                {conflict.officerDecision}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">Bank:</span>
                            <span className="font-medium text-sm">
                              {conflict.bankName}
                            </span>
                          </div>
                          {conflict.officerRemarks && (
                            <div>
                              <span className="text-sm text-gray-700 block mb-1">
                                Remarks:
                              </span>
                              <p className="text-sm text-gray-800 bg-white rounded p-2 border border-purple-200">
                                {conflict.officerRemarks}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm text-gray-600">
                      <span>Status: {conflict.status}</span>
                      <a
                        href={`/admin/submissions/${conflict._id}`}
                        className="text-orange-600 hover:text-orange-700 font-medium"
                      >
                        View Details →
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-sm text-gray-700">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
