"use client";
import React, { useEffect, useState } from "react";
import {
  IconShieldCheck,
  IconAlertTriangle,
  IconRefresh,
  IconEye,
  IconSearch,
  IconFilter,
  IconChevronDown,
  IconX,
  IconClockHour4,
  IconFileAnalytics,
} from "@tabler/icons-react";
import { cn } from "../../lib/utils";

interface LedgerMonitorProps {
  className?: string;
}

interface LoanLedgerStatus {
  loanId: string;
  borrowerName: string;
  loanAmount: number;
  status: string;
  verification: {
    isValid: boolean;
    totalEntries: number;
    invalidEntries: number[];
    brokenChain: boolean;
    errors: string[];
  };
  lastActivity: {
    timestamp: Date;
    eventType: string;
    performedBy: string;
  } | null;
  entryCount: number;
  tamperedAt: Date | null;
}

interface LedgerEntry {
  id: string;
  sequenceNum: number;
  eventType: string;
  eventData: any;
  amount: number | null;
  performedBy: string;
  timestamp: Date;
  currentHash: string;
  previousHash: string;
  ipAddress: string | null;
}

export function LedgerMonitor({ className }: LedgerMonitorProps) {
  const [loans, setLoans] = useState<LoanLedgerStatus[]>([]);
  const [filteredLoans, setFilteredLoans] = useState<LoanLedgerStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "valid" | "tampered">("all");
  const [selectedLoan, setSelectedLoan] = useState<LoanLedgerStatus | null>(null);
  const [ledgerHistory, setLedgerHistory] = useState<LedgerEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [summary, setSummary] = useState({
    totalLoans: 0,
    validLoans: 0,
    tamperedLoans: 0,
    criticalAlerts: 0,
  });

  useEffect(() => {
    fetchLedgerData();
  }, []);

  useEffect(() => {
    filterLoans();
  }, [searchTerm, filterStatus, loans]);

  const fetchLedgerData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/ledger-monitor");
      const data = await response.json();

      if (data.success) {
        setLoans(data.loans);
        setSummary(data.summary);
      } else {
        console.error("Failed to fetch ledger data:", data.error);
      }
    } catch (error) {
      console.error("Error fetching ledger data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLedgerHistory = async (loanId: string) => {
    try {
      setLoadingHistory(true);
      const response = await fetch(`/api/admin/ledger-history?loanId=${loanId}`);
      const data = await response.json();

      if (data.success) {
        setLedgerHistory(data.entries);
      } else {
        console.error("Failed to fetch ledger history:", data.error);
      }
    } catch (error) {
      console.error("Error fetching ledger history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const filterLoans = () => {
    let filtered = loans;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (loan) =>
          loan.loanId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          loan.borrowerName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (filterStatus === "valid") {
      filtered = filtered.filter((loan) => loan.verification.isValid);
    } else if (filterStatus === "tampered") {
      filtered = filtered.filter((loan) => !loan.verification.isValid);
    }

    setFilteredLoans(filtered);
  };

  const handleViewDetails = async (loan: LoanLedgerStatus) => {
    setSelectedLoan(loan);
    await fetchLedgerHistory(loan.loanId);
  };

  const closeModal = () => {
    setSelectedLoan(null);
    setLedgerHistory([]);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString();
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">
              Ledger Security Monitor
            </h1>
            <p className="text-sm text-neutral-600 mt-1">
              Real-time blockchain ledger integrity monitoring and tampering detection
            </p>
          </div>
          <button
            onClick={fetchLedgerData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
          >
            <IconRefresh className={cn("h-5 w-5", loading && "animate-spin")} />
            Refresh
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 border border-neutral-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">Total Loans</p>
                <p className="text-2xl font-bold text-neutral-900 mt-1">
                  {summary.totalLoans}
                </p>
              </div>
              <IconFileAnalytics className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-green-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">Valid Loans</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {summary.validLoans}
                </p>
              </div>
              <IconShieldCheck className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-red-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">Tampered</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {summary.tamperedLoans}
                </p>
              </div>
              <IconAlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-orange-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">Critical Alerts</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  {summary.criticalAlerts}
                </p>
              </div>
              <IconAlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-4 mb-4 border border-neutral-200 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by Loan ID or Borrower Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-neutral-900"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus("all")}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-colors",
                filterStatus === "all"
                  ? "bg-orange-600 text-white"
                  : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              )}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus("valid")}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-colors",
                filterStatus === "valid"
                  ? "bg-green-600 text-white"
                  : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              )}
            >
              Valid
            </button>
            <button
              onClick={() => setFilterStatus("tampered")}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-colors",
                filterStatus === "tampered"
                  ? "bg-red-600 text-white"
                  : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              )}
            >
              Tampered
            </button>
          </div>
        </div>
      </div>

      {/* Loans Table */}
      <div className="bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredLoans.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-neutral-500">
            <IconFileAnalytics className="h-16 w-16 mb-4 opacity-50" />
            <p className="text-lg font-medium">No loans found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                    Loan ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                    Borrower
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                    Entries
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                    Last Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                    Issues
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredLoans.map((loan) => (
                  <tr
                    key={loan.loanId}
                    className={cn(
                      "hover:bg-neutral-50 transition-colors",
                      !loan.verification.isValid && "bg-red-50"
                    )}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      {loan.verification.isValid ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <IconShieldCheck className="h-5 w-5" />
                          <span className="text-sm font-medium">Valid</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-red-600">
                          <IconAlertTriangle className="h-5 w-5" />
                          <span className="text-sm font-medium">Tampered</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-neutral-900">
                        {loan.loanId.substring(0, 12)}...
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-900">
                        {loan.borrowerName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-neutral-900">
                        {formatAmount(loan.loanAmount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-900">
                        {loan.entryCount}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {loan.lastActivity ? (
                        <div className="text-xs text-neutral-600">
                          <div>{loan.lastActivity.eventType}</div>
                          <div className="text-neutral-500">
                            {formatDate(loan.lastActivity.timestamp)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-neutral-500">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {loan.verification.isValid ? (
                        <span className="text-sm text-neutral-500">None</span>
                      ) : (
                        <div className="text-xs text-red-600">
                          {loan.verification.errors.length} error(s)
                          {loan.verification.brokenChain && (
                            <div className="text-red-700 font-medium">
                              ⚠️ Chain Broken
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleViewDetails(loan)}
                        className="flex items-center gap-1 px-3 py-1 text-sm text-orange-600 hover:text-orange-800 font-medium transition-colors"
                      >
                        <IconEye className="h-4 w-4" />
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedLoan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-neutral-900">
                  Ledger History Details
                </h2>
                <p className="text-sm text-neutral-600 mt-1">
                  Loan ID: {selectedLoan.loanId}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <IconX className="h-6 w-6 text-neutral-600" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Loan Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <p className="text-sm text-neutral-600">Borrower</p>
                  <p className="font-medium text-neutral-900">
                    {selectedLoan.borrowerName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Amount</p>
                  <p className="font-medium text-neutral-900">
                    {formatAmount(selectedLoan.loanAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Status</p>
                  <p className="font-medium text-neutral-900">
                    {selectedLoan.status}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Verification</p>
                  <p
                    className={cn(
                      "font-medium",
                      selectedLoan.verification.isValid
                        ? "text-green-600"
                        : "text-red-600"
                    )}
                  >
                    {selectedLoan.verification.isValid ? "✓ Valid" : "✗ Tampered"}
                  </p>
                </div>
              </div>

              {/* Errors */}
              {!selectedLoan.verification.isValid && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-semibold text-red-800 mb-2">
                    ⚠️ Tampering Detected
                  </h3>
                  <div className="space-y-1">
                    {selectedLoan.verification.errors.map((error, index) => (
                      <p key={index} className="text-sm text-red-700">
                        • {error}
                      </p>
                    ))}
                  </div>
                  {selectedLoan.verification.brokenChain && (
                    <p className="mt-2 text-sm font-medium text-red-800">
                      🔗 Chain Integrity Compromised - Entries may have been deleted or
                      reordered
                    </p>
                  )}
                </div>
              )}

              {/* Ledger History */}
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                  Ledger History ({ledgerHistory.length} entries)
                </h3>
                {loadingHistory ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {ledgerHistory.map((entry, index) => (
                      <div
                        key={entry.id}
                        className={cn(
                          "border rounded-lg p-4",
                          selectedLoan.verification.invalidEntries.includes(
                            entry.sequenceNum
                          )
                            ? "border-red-500 bg-red-50"
                            : "border-neutral-200 bg-neutral-50"
                        )}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="bg-orange-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                              {entry.sequenceNum}
                            </div>
                            <div>
                              <h4 className="font-semibold text-neutral-900">
                                {entry.eventType}
                              </h4>
                              <p className="text-xs text-neutral-600">
                                {formatDate(entry.timestamp)}
                              </p>
                            </div>
                          </div>
                          {entry.amount && (
                            <div className="text-right">
                              <p className="font-semibold text-neutral-900">
                                {formatAmount(entry.amount)}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="ml-11 space-y-2">
                          <div className="text-sm">
                            <span className="text-neutral-600">
                              Performed by:{" "}
                            </span>
                            <span className="font-medium text-neutral-900">
                              {entry.performedBy}
                            </span>
                          </div>
                          {entry.ipAddress && (
                            <div className="text-sm">
                              <span className="text-neutral-600">
                                IP Address:{" "}
                              </span>
                              <span className="font-mono text-neutral-900">
                                {entry.ipAddress}
                              </span>
                            </div>
                          )}
                          <details className="text-sm">
                            <summary className="cursor-pointer text-orange-600 hover:text-orange-800">
                              View Event Data
                            </summary>
                            <pre className="mt-2 p-2 bg-neutral-100 rounded text-xs overflow-x-auto">
                              {JSON.stringify(entry.eventData, null, 2)}
                            </pre>
                          </details>
                          <details className="text-sm">
                            <summary className="cursor-pointer text-neutral-600 hover:text-neutral-800">
                              View Hash Info
                            </summary>
                            <div className="mt-2 space-y-1 text-xs font-mono">
                              <div>
                                <span className="text-neutral-600">
                                  Current:{" "}
                                </span>
                                <span className="text-neutral-900">
                                  {entry.currentHash}
                                </span>
                              </div>
                              <div>
                                <span className="text-neutral-600">
                                  Previous:{" "}
                                </span>
                                <span className="text-neutral-900">
                                  {entry.previousHash}
                                </span>
                              </div>
                            </div>
                          </details>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
