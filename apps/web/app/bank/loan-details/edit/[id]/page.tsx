"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { IconArrowLeft, IconDeviceFloppy } from "@tabler/icons-react";
import { BankSidebar } from "../../../../../components/bank/BankSidebar";

interface BankData {
  name: string;
  branchName?: string;
  contactName?: string;
  contactEmail?: string;
  ifsc?: string;
}

interface RuleSet {
  _id: string;
  name: string;
  description?: string;
  version: number;
}

export default function EditLoanDetailPage() {
  const router = useRouter();
  const params = useParams();
  const loanId = params.id as string;

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bankData, setBankData] = useState<BankData | null>(null);
  const [rulesets, setRulesets] = useState<RuleSet[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [schemeName, setSchemeName] = useState("");
  const [schemeCode, setSchemeCode] = useState("");
  const [schemeCategory, setSchemeCategory] = useState("");
  const [assetType, setAssetType] = useState("");
  const [purpose, setPurpose] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [subsidyPercentage, setSubsidyPercentage] = useState("");
  const [marginMoneyPercentage, setMarginMoneyPercentage] = useState("");
  const [allowedDisbursementModes, setAllowedDisbursementModes] = useState<string[]>(["FULL"]);
  const [rullsetid, setRullsetid] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    validateBankSession();
  }, []);

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
      await fetchRulesets();
      await fetchLoanDetail();
    } catch (error) {
      console.error("Session validation error:", error);
      router.push("/bank/signin");
    }
  };

  const fetchRulesets = async () => {
    try {
      const response = await fetch("/api/rullset");
      const data = await response.json();
      if (data.success) {
        setRulesets(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching rulesets:", err);
    }
  };

  const fetchLoanDetail = async () => {
    try {
      const response = await fetch(`/api/create-loan?id=${loanId}`);
      const data = await response.json();

      if (data.success && data.data) {
        const loan = data.data;
        setName(loan.name || "");
        setDescription(loan.description || "");
        setSchemeName(loan.schemeName || "");
        setSchemeCode(loan.schemeCode || "");
        setSchemeCategory(loan.schemeCategory || "");
        setAssetType(loan.assetType || "");
        setPurpose(loan.purpose || "");
        setMinAmount(loan.minAmount?.toString() || "");
        setMaxAmount(loan.maxAmount?.toString() || "");
        setSubsidyPercentage(loan.subsidyPercentage?.toString() || "");
        setMarginMoneyPercentage(loan.marginMoneyPercentage?.toString() || "");
        setAllowedDisbursementModes(loan.allowedDisbursementModes || ["FULL"]);
        setRullsetid(loan.rullsetid || "");
        setIsActive(loan.isActive ?? true);
      } else {
        setError("Loan product not found");
      }
    } catch (err) {
      setError("Error loading loan product");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDisbursementModeChange = (mode: string) => {
    setAllowedDisbursementModes((prev) =>
      prev.includes(mode)
        ? prev.filter((m) => m !== mode)
        : [...prev, mode]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        id: loanId,
        name,
        description,
        schemeName,
        schemeCode,
        schemeCategory,
        assetType,
        purpose,
        minAmount: Number(minAmount),
        maxAmount: Number(maxAmount),
        subsidyPercentage: subsidyPercentage ? Number(subsidyPercentage) : undefined,
        marginMoneyPercentage: marginMoneyPercentage ? Number(marginMoneyPercentage) : undefined,
        allowedDisbursementModes,
        rullsetid,
        isActive,
      };

      const response = await fetch("/api/create-loan", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Loan product updated successfully!");
        setTimeout(() => router.push("/bank/loan-details"), 1500);
      } else {
        setError(data.message || "Failed to update loan product");
      }
    } catch (err) {
      setError("Error updating loan product");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !bankData) {
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
          <div className="flex items-center gap-4 pb-4 border-b border-neutral-200">
            <button
              onClick={() => router.push("/bank/loan-details")}
              className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <IconArrowLeft className="h-5 w-5 text-neutral-700" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                Edit Loan Product
              </h1>
              <p className="text-sm text-neutral-600 mt-1">
                Update loan product details
              </p>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="p-4 rounded-lg bg-red-50 text-red-600">
              {error}
            </div>
          )}
          {success && (
            <div className="p-4 rounded-lg bg-green-50 text-green-600">
              {success}
            </div>
          )}

          {/* Form - Same structure as Add page */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="rounded-xl border border-neutral-200 bg-white p-6">
              <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Scheme Name
                  </label>
                  <input
                    type="text"
                    value={schemeName}
                    onChange={(e) => setSchemeName(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Scheme Code
                  </label>
                  <input
                    type="text"
                    value={schemeCode}
                    onChange={(e) => setSchemeCode(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Scheme Category
                  </label>
                  <input
                    type="text"
                    value={schemeCategory}
                    onChange={(e) => setSchemeCategory(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Asset Type *
                  </label>
                  <input
                    type="text"
                    value={assetType}
                    onChange={(e) => setAssetType(e.target.value)}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Purpose
                  </label>
                  <input
                    type="text"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>

            {/* Financial Details */}
            <div className="rounded-xl border border-neutral-200 bg-white p-6">
              <h3 className="text-lg font-semibold mb-4">Financial Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Minimum Amount (₹) *
                  </label>
                  <input
                    type="number"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                    required
                    min="0"
                    step="1000"
                    className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Maximum Amount (₹) *
                  </label>
                  <input
                    type="number"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                    required
                    min="0"
                    step="1000"
                    className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Subsidy Percentage (%)
                  </label>
                  <input
                    type="number"
                    value={subsidyPercentage}
                    onChange={(e) => setSubsidyPercentage(e.target.value)}
                    min="0"
                    max="100"
                    step="0.1"
                    className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Margin Money Percentage (%)
                  </label>
                  <input
                    type="number"
                    value={marginMoneyPercentage}
                    onChange={(e) => setMarginMoneyPercentage(e.target.value)}
                    min="0"
                    max="100"
                    step="0.1"
                    className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>

            {/* Disbursement & Verification */}
            <div className="rounded-xl border border-neutral-200 bg-white p-6">
              <h3 className="text-lg font-semibold mb-4">Disbursement & Verification</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-3">
                    Allowed Disbursement Modes *
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="full"
                        checked={allowedDisbursementModes.includes("FULL")}
                        onChange={() => handleDisbursementModeChange("FULL")}
                        className="w-4 h-4 text-orange-600 border-neutral-300 rounded focus:ring-orange-500"
                      />
                      <label htmlFor="full" className="text-sm text-neutral-700">
                        Full Payment
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="installments"
                        checked={allowedDisbursementModes.includes("INSTALLMENTS")}
                        onChange={() => handleDisbursementModeChange("INSTALLMENTS")}
                        className="w-4 h-4 text-orange-600 border-neutral-300 rounded focus:ring-orange-500"
                      />
                      <label htmlFor="installments" className="text-sm text-neutral-700">
                        Installments
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="vendor"
                        checked={allowedDisbursementModes.includes("VENDOR_PAYMENT")}
                        onChange={() => handleDisbursementModeChange("VENDOR_PAYMENT")}
                        className="w-4 h-4 text-orange-600 border-neutral-300 rounded focus:ring-orange-500"
                      />
                      <label htmlFor="vendor" className="text-sm text-neutral-700">
                        Vendor Payment
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Verification RuleSet *
                  </label>
                  <select
                    value={rullsetid}
                    onChange={(e) => setRullsetid(e.target.value)}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select RuleSet</option>
                    {rulesets.map((ruleset) => (
                      <option key={ruleset._id} value={ruleset._id}>
                        {ruleset.name} (v{ruleset.version})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-orange-600 border-neutral-300 rounded focus:ring-orange-500"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-neutral-700">
                    Active
                  </label>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
              <button
                type="button"
                onClick={() => router.push("/bank/loan-details")}
                className="px-6 py-2 rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <IconDeviceFloppy className="h-4 w-4" />
                    Update Loan Product
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
