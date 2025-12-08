"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IconPlus, IconEdit, IconSearch, IconCopy, IconCheck } from "@tabler/icons-react";
import { BankSidebar } from "../../../components/bank/BankSidebar";

interface BankData {
  name: string;
  branchName?: string;
  contactName?: string;
  contactEmail?: string;
  ifsc?: string;
}

interface LoanDetail {
  _id: string;
  name: string;
  description?: string;
  schemeName?: string;
  schemeCode?: string;
  assetType: string;
  minAmount: number;
  maxAmount: number;
  subsidyPercentage?: number;
  isActive: boolean;
  createdAt: string;
}

export default function LoanDetailsPage() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bankData, setBankData] = useState<BankData | null>(null);
  const [loanDetails, setLoanDetails] = useState<LoanDetail[]>([]);
  const [filteredLoans, setFilteredLoans] = useState<LoanDetail[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    validateBankSession();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredLoans(loanDetails);
    } else {
      const filtered = loanDetails.filter(
        (loan) =>
          loan._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          loan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          loan.schemeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          loan.assetType.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredLoans(filtered);
    }
  }, [searchTerm, loanDetails]);

  const validateBankSession = async () => {
    try {
      const response = await fetch("/api/verify", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const data = await response.json();

      if (!data.success || data.type !== "bank") {
        router.push("/bank/signin");
        return;
      }

      setBankData(data.data);
      fetchLoanDetails();
    } catch (error) {
      console.error("Session validation error:", error);
      router.push("/bank/signin");
    }
  };

  const fetchLoanDetails = async () => {
    try {
      const response = await fetch("/api/create-loan");
      const data = await response.json();

      if (data.success) {
        setLoanDetails(data.data || []);
        setFilteredLoans(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching loan details:", err);
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

  const copyToClipboard = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (!bankData) {
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
      <BankSidebar open={open} setOpen={setOpen} bankData={bankData} />

      <div className="flex flex-1 flex-col overflow-auto">
        <div className="flex w-full flex-col gap-4 rounded-tl-2xl border border-neutral-200 bg-white p-4 md:p-8">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                Loan Products
              </h1>
              <p className="text-sm text-neutral-600 mt-1">
                Manage loan products and schemes
              </p>
            </div>
            <button
              onClick={() => router.push("/bank/loan-details/add")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors"
            >
              <IconPlus className="h-4 w-4" />
              Add Loan Product
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by ID, name, scheme, or asset type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Loan Details Table */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredLoans.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-neutral-500">
                {searchTerm ? "No loan products found matching your search." : "No loan products available. Create your first one!"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-neutral-200">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Loan ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Product Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Scheme
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Asset Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Amount Range
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Subsidy
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {filteredLoans.map((loan) => (
                    <tr key={loan._id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-neutral-100 px-2 py-1 rounded font-mono text-neutral-700">
                            {loan._id}
                          </code>
                          <button
                            onClick={() => copyToClipboard(loan._id)}
                            className="p-1 hover:bg-neutral-100 rounded transition-colors flex-shrink-0"
                            title="Copy ID"
                          >
                            {copiedId === loan._id ? (
                              <IconCheck className="h-4 w-4 text-green-600" />
                            ) : (
                              <IconCopy className="h-4 w-4 text-neutral-400" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-neutral-900">
                          {loan.name}
                        </div>
                        {loan.description && (
                          <div className="text-xs text-neutral-500 mt-1">
                            {loan.description.substring(0, 50)}
                            {loan.description.length > 50 && "..."}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-neutral-900">
                          {loan.schemeName || "-"}
                        </div>
                        {loan.schemeCode && (
                          <div className="text-xs text-neutral-500">
                            {loan.schemeCode}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-md bg-blue-100 text-blue-700">
                          {loan.assetType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                        <div>{formatCurrency(loan.minAmount)}</div>
                        <div className="text-xs text-neutral-500">
                          to {formatCurrency(loan.maxAmount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                        {loan.subsidyPercentage ? `${loan.subsidyPercentage}%` : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-md ${
                            loan.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {loan.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() =>
                            router.push(`/bank/loan-details/edit/${loan._id}`)
                          }
                          className="text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
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
  );
}
