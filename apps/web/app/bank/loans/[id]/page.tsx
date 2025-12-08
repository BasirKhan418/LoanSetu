"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { IconArrowLeft, IconEdit, IconCurrencyRupee, IconUser, IconCalendar, IconBuilding } from "@tabler/icons-react";
import { BankSidebar } from "../../../../components/bank/BankSidebar";

interface BankData {
  name: string;
  branchName?: string;
  ifsc?: string;
}

interface LoanData {
  _id: string;
  loanNumber: string;
  beneficiaryId: {
    _id: string;
    name: string;
    phone: string;
    email?: string;
    addressLine1?: string;
    addressLine2?: string;
    village?: string;
    block?: string;
    district?: string;
    state?: string;
    pincode?: string;
  };
  loanDetailsId: {
    _id: string;
    name: string;
    schemeName?: string;
    schemeCode?: string;
    assetType?: string;
  };
  sanctionAmount: number;
  currency: string;
  sanctionDate: string;
  disbursementMode: string;
  verificationStatus: string;
  lastAiRiskScore?: number;
  lastAiDecision?: string;
  officerRemarks?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ViewLoanPage() {
  const router = useRouter();
  const params = useParams();
  const loanId = params.id as string;

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bankData, setBankData] = useState<BankData | null>(null);
  const [loanData, setLoanData] = useState<LoanData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    validateBankSession();
  }, []);

  const validateBankSession = async () => {
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

      setBankData({
        name: data.data.name || "Bank",
        branchName: data.data.branchName,
        ifsc: data.data.ifsc,
      });

      fetchLoanData();
    } catch (err) {
      console.error("Session validation error:", err);
      router.push("/bank/signin");
    }
  };

  const fetchLoanData = async () => {
    try {
      const response = await fetch("/api/loans", {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (data.success && data.data) {
        const loan = data.data.find((l: any) => l._id === loanId);
        if (loan) {
          setLoanData(loan);
        } else {
          setError("Loan not found");
        }
      } else {
        setError("Failed to fetch loan data");
      }
    } catch (err) {
      console.error("Error fetching loan:", err);
      setError("Error loading loan data");
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800 border-green-200";
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-200";
      case "UNDER_REVIEW":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-orange-100 text-orange-800 border-orange-200";
    }
  };

  if (!bankData || loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-600 font-medium">Loading loan details...</p>
        </div>
      </div>
    );
  }

  if (error || !loanData) {
    return (
      <div className="mx-auto flex w-full flex-1 flex-col overflow-hidden bg-white md:flex-row h-screen">
        <BankSidebar open={open} setOpen={setOpen} bankData={bankData} />
        <div className="flex flex-1 flex-col items-center justify-center p-8">
          <div className="text-center">
            <p className="text-red-600 text-lg font-medium">{error || "Loan not found"}</p>
            <button
              onClick={() => router.back()}
              className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full flex-1 flex-col overflow-hidden bg-white md:flex-row h-screen">
      <BankSidebar open={open} setOpen={setOpen} bankData={bankData} />

      <div className="flex flex-1 flex-col overflow-auto">
        <div className="flex w-full flex-col gap-6 rounded-tl-2xl border border-neutral-200 bg-white p-4 md:p-8">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <IconArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                  Loan Details
                </h1>
                <p className="text-sm text-neutral-600 mt-1">
                  {loanData.loanNumber}
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push(`/bank/loans/edit/${loanId}`)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors"
            >
              <IconEdit className="h-4 w-4" />
              Edit Loan
            </button>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-3">
            <span className={`inline-flex px-4 py-2 text-sm font-semibold rounded-lg border ${getStatusColor(loanData.verificationStatus)}`}>
              {loanData.verificationStatus}
            </span>
            {!loanData.isActive && (
              <span className="inline-flex px-4 py-2 text-sm font-semibold rounded-lg border bg-gray-100 text-gray-800 border-gray-200">
                Inactive
              </span>
            )}
          </div>

          {/* Main Info Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Loan Information */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200 p-6">
              <h2 className="text-lg font-semibold text-orange-900 mb-4 flex items-center gap-2">
                <IconCurrencyRupee className="h-5 w-5" />
                Loan Information
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-orange-700 font-medium">Sanction Amount</p>
                  <p className="text-2xl font-bold text-orange-900">{formatCurrency(loanData.sanctionAmount)}</p>
                </div>
                <div>
                  <p className="text-sm text-orange-700 font-medium">Currency</p>
                  <p className="text-lg text-orange-900">{loanData.currency}</p>
                </div>
                <div>
                  <p className="text-sm text-orange-700 font-medium">Disbursement Mode</p>
                  <p className="text-lg text-orange-900">{loanData.disbursementMode}</p>
                </div>
                <div>
                  <p className="text-sm text-orange-700 font-medium">Sanction Date</p>
                  <p className="text-lg text-orange-900">{formatDate(loanData.sanctionDate)}</p>
                </div>
              </div>
            </div>

            {/* Beneficiary Information */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 p-6">
              <h2 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                <IconUser className="h-5 w-5" />
                Beneficiary Information
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-blue-700 font-medium">Name</p>
                  <p className="text-lg text-blue-900">{loanData.beneficiaryId.name}</p>
                </div>
                <div>
                  <p className="text-sm text-blue-700 font-medium">Phone</p>
                  <p className="text-lg text-blue-900">{loanData.beneficiaryId.phone}</p>
                </div>
                {loanData.beneficiaryId.email && (
                  <div>
                    <p className="text-sm text-blue-700 font-medium">Email</p>
                    <p className="text-lg text-blue-900">{loanData.beneficiaryId.email}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-blue-700 font-medium">Address</p>
                  <p className="text-sm text-blue-900">
                    {[
                      loanData.beneficiaryId.addressLine1,
                      loanData.beneficiaryId.addressLine2,
                      loanData.beneficiaryId.village,
                      loanData.beneficiaryId.block,
                      loanData.beneficiaryId.district,
                      loanData.beneficiaryId.state,
                      loanData.beneficiaryId.pincode,
                    ]
                      .filter(Boolean)
                      .join(", ") || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Scheme Information */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 p-6">
              <h2 className="text-lg font-semibold text-green-900 mb-4 flex items-center gap-2">
                <IconBuilding className="h-5 w-5" />
                Loan Scheme
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-green-700 font-medium">Scheme Name</p>
                  <p className="text-lg text-green-900">{loanData.loanDetailsId.name}</p>
                </div>
                {loanData.loanDetailsId.schemeName && (
                  <div>
                    <p className="text-sm text-green-700 font-medium">Official Scheme Name</p>
                    <p className="text-lg text-green-900">{loanData.loanDetailsId.schemeName}</p>
                  </div>
                )}
                {loanData.loanDetailsId.schemeCode && (
                  <div>
                    <p className="text-sm text-green-700 font-medium">Scheme Code</p>
                    <p className="text-lg text-green-900">{loanData.loanDetailsId.schemeCode}</p>
                  </div>
                )}
                {loanData.loanDetailsId.assetType && (
                  <div>
                    <p className="text-sm text-green-700 font-medium">Asset Type</p>
                    <p className="text-lg text-green-900">{loanData.loanDetailsId.assetType}</p>
                  </div>
                )}
              </div>
            </div>

            {/* AI & Metadata */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200 p-6">
              <h2 className="text-lg font-semibold text-purple-900 mb-4 flex items-center gap-2">
                <IconCalendar className="h-5 w-5" />
                Additional Information
              </h2>
              <div className="space-y-3">
                {loanData.lastAiRiskScore !== null && loanData.lastAiRiskScore !== undefined && (
                  <div>
                    <p className="text-sm text-purple-700 font-medium">AI Risk Score</p>
                    <p className="text-lg text-purple-900">{loanData.lastAiRiskScore}/100</p>
                  </div>
                )}
                {loanData.lastAiDecision && (
                  <div>
                    <p className="text-sm text-purple-700 font-medium">AI Decision</p>
                    <p className="text-lg text-purple-900">{loanData.lastAiDecision}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-purple-700 font-medium">Created On</p>
                  <p className="text-lg text-purple-900">{formatDate(loanData.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-purple-700 font-medium">Last Updated</p>
                  <p className="text-lg text-purple-900">{formatDate(loanData.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Officer Remarks */}
          {loanData.officerRemarks && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-3">Officer Remarks</h2>
              <p className="text-neutral-700 whitespace-pre-wrap">{loanData.officerRemarks}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
