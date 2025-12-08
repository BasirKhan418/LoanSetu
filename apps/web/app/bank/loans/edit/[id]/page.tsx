"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { IconArrowLeft, IconDeviceFloppy } from "@tabler/icons-react";
import { BankSidebar } from "../../../../../components/bank/BankSidebar";

interface BankData {
  name: string;
  branchName?: string;
  ifsc?: string;
}

interface LoanData {
  _id: string;
  loanNumber: string;
  beneficiaryId: any;
  loanDetailsId: any;
  sanctionAmount: number;
  currency: string;
  sanctionDate: string;
  disbursementMode: string;
  verificationStatus: string;
  lastAiRiskScore?: number;
  lastAiDecision?: string;
  officerRemarks?: string;
  isActive: boolean;
}

export default function EditLoanPage() {
  const router = useRouter();
  const params = useParams();
  const loanId = params.id as string;

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bankData, setBankData] = useState<BankData | null>(null);
  const [loanData, setLoanData] = useState<LoanData | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form fields
  const [sanctionAmount, setSanctionAmount] = useState("");
  const [disbursementMode, setDisbursementMode] = useState("FULL");
  const [verificationStatus, setVerificationStatus] = useState("PENDING");
  const [officerRemarks, setOfficerRemarks] = useState("");
  const [isActive, setIsActive] = useState(true);

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
          setSanctionAmount(loan.sanctionAmount.toString());
          setDisbursementMode(loan.disbursementMode);
          setVerificationStatus(loan.verificationStatus);
          setOfficerRemarks(loan.officerRemarks || "");
          setIsActive(loan.isActive);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const response = await fetch("/api/loans", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          id: loanId,
          sanctionAmount: Number(sanctionAmount),
          disbursementMode,
          verificationStatus,
          officerRemarks,
          isActive,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Loan updated successfully!");
        setTimeout(() => {
          router.push(`/bank/loans/${loanId}`);
        }, 1500);
      } else {
        setError(data.message || "Failed to update loan");
      }
    } catch (err: any) {
      console.error(err);
      setError(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (!bankData || loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (error && !loanData) {
    return (
      <div className="mx-auto flex w-full flex-1 flex-col overflow-hidden bg-white md:flex-row h-screen">
        <BankSidebar open={open} setOpen={setOpen} bankData={bankData} />
        <div className="flex flex-1 flex-col items-center justify-center p-8">
          <div className="text-center">
            <p className="text-red-600 text-lg font-medium">{error}</p>
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
          <div className="flex items-center gap-4 pb-4 border-b border-neutral-200">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <IconArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                Edit Loan
              </h1>
              <p className="text-sm text-neutral-600 mt-1">
                {loanData?.loanNumber}
              </p>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}

          {/* Loan Info (Read-only) */}
          <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Loan Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-neutral-600">Beneficiary</p>
                <p className="font-medium text-neutral-900">{loanData?.beneficiaryId?.name}</p>
              </div>
              <div>
                <p className="text-neutral-600">Phone</p>
                <p className="font-medium text-neutral-900">{loanData?.beneficiaryId?.phone}</p>
              </div>
              <div>
                <p className="text-neutral-600">Loan Scheme</p>
                <p className="font-medium text-neutral-900">{loanData?.loanDetailsId?.name}</p>
              </div>
              <div>
                <p className="text-neutral-600">Sanction Date</p>
                <p className="font-medium text-neutral-900">
                  {loanData?.sanctionDate && new Date(loanData.sanctionDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-6">
              <h2 className="text-lg font-semibold text-neutral-900">Editable Fields</h2>

              {/* Sanction Amount */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Sanction Amount *
                </label>
                <input
                  type="number"
                  value={sanctionAmount}
                  onChange={(e) => setSanctionAmount(e.target.value)}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Disbursement Mode */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Disbursement Mode *
                </label>
                <select
                  value={disbursementMode}
                  onChange={(e) => setDisbursementMode(e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="FULL">Full</option>
                  <option value="INSTALLMENTS">Installments</option>
                  <option value="VENDOR_PAYMENT">Vendor Payment</option>
                </select>
              </div>

              {/* Verification Status */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Verification Status *
                </label>
                <select
                  value={verificationStatus}
                  onChange={(e) => setVerificationStatus(e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="PENDING">Pending</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              {/* Officer Remarks */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Officer Remarks
                </label>
                <textarea
                  value={officerRemarks}
                  onChange={(e) => setOfficerRemarks(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Add any remarks or notes about this loan..."
                />
              </div>

              {/* Is Active */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-orange-600 rounded focus:ring-2 focus:ring-orange-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-neutral-700">
                  Active Loan
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    <IconDeviceFloppy className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2.5 rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
