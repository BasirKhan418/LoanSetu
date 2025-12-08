"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconBuildingBank,
  IconArrowLeft,
} from "@tabler/icons-react";
import { cn } from "../../../../lib/utils";
import { AdminSidebar } from "../../../../components/admin/AdminSidebar";

interface BankFormData {
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

interface Tenant {
  _id: string;
  code: string;
  name: string;
  logoUrl?: string;
  isActive: boolean;
}

export default function AddBankPage() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [formData, setFormData] = useState<BankFormData>({
    name: "",
    branchName: "",
    ifsc: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    state: "",
    district: "",
    tenantId: "",
    isActive: true,
  });

  useEffect(() => {
    validateAdminSession();
  }, []);

  const validateAdminSession = async () => {
    try {
      const token = getCookie("token");
      
      if (!token) {
        router.push("/admin/signin");
        return;
      }

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
      
      // If not super admin, pre-fill state and tenantId
      if (!data.data.isSuperAdmin) {
        setFormData(prev => ({
          ...prev,
          state: data.data.state,
          tenantId: data.data.tenantId,
        }));
      } else {
        // Fetch tenants for super admin
        await fetchTenants();
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Session validation error:", error);
      router.push("/admin/signin");
    }
  };

  const fetchTenants = async () => {
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
      }
    } catch (err) {
      console.error("Error fetching tenants:", err);
    }
  };

  const getCookie = (name: string): string | null => {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
    return null;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    // Auto-uppercase IFSC code
    if (name === "ifsc") {
      setFormData((prev) => ({
        ...prev,
        [name]: value.toUpperCase(),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]:
          type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
      }));
    }
  };

  const handleTenantChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tenantId = e.target.value;
    const selectedTenant = tenants.find(t => t._id === tenantId);
    
    if (selectedTenant) {
      setFormData((prev) => ({
        ...prev,
        tenantId,
        state: selectedTenant.name,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        tenantId: "",
        state: "",
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess(false);

    // Validate IFSC format (11 characters: 4 letters + 0 + 6 alphanumeric)
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(formData.ifsc)) {
      setError("Invalid IFSC code format. Must be 11 characters (e.g., SBIN0000123)");
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/bankauth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          ...formData,
          type: "CreateBank",
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/admin/banks");
        }, 2000);
      } else {
        setError(data.message || "Failed to create bank officer");
      }
    } catch (err) {
      setError("Error creating bank officer. Please try again.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
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
    <div
      className={cn(
        "mx-auto flex w-full flex-1 flex-col overflow-hidden bg-white md:flex-row",
        "h-screen"
      )}
    >
      <AdminSidebar open={open} setOpen={setOpen} adminData={adminData || undefined} />
      <div className="flex flex-1 flex-col overflow-auto">
        <div className="flex h-full w-full flex-1 flex-col gap-4 rounded-tl-2xl border border-neutral-200 bg-white p-4 md:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-neutral-200">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/admin/banks")}
                className="p-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 transition-colors"
              >
                <IconArrowLeft className="h-5 w-5 text-neutral-700" />
              </button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                  Add Bank Officer
                </h1>
                <p className="text-sm text-neutral-600 mt-1">
                  Create a new bank officer entry
                </p>
              </div>
            </div>
          </div>

          {/* Alert Messages */}
          {error && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-600">
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-600">
              Bank officer created successfully! Redirecting...
            </div>
          )}

          {!adminData?.isSuperAdmin && (
            <div className="p-4 rounded-lg bg-orange-50 border border-orange-200 text-orange-600">
              You are creating a bank officer for {adminData?.state}.
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto">
            {/* Bank Details Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                <IconBuildingBank className="h-5 w-5 text-orange-600" />
                Bank Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Bank Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., State Bank of India"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Branch Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="branchName"
                    value={formData.branchName}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., Bhubaneswar Main Branch"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    IFSC Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="ifsc"
                    value={formData.ifsc}
                    onChange={handleInputChange}
                    required
                    maxLength={11}
                    placeholder="e.g., SBIN0000123"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono"
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    11 characters: 4 letters + 0 + 6 alphanumeric
                  </p>
                </div>

                {adminData?.isSuperAdmin && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Tenant/State <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="tenantId"
                      value={formData.tenantId}
                      onChange={handleTenantChange}
                      required
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="">Select tenant</option>
                      {tenants.map((tenant) => (
                        <option key={tenant._id} value={tenant._id}>
                          {tenant.name} ({tenant.code})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    State <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    required
                    disabled={!adminData?.isSuperAdmin}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-neutral-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    District <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., Khordha"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Contact Details Section */}
            <div className="space-y-4 pt-4 border-t border-neutral-200">
              <h2 className="text-lg font-semibold text-neutral-900">Contact Person Details</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Contact Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="contactName"
                    value={formData.contactName}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., Arun Kumar"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Contact Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., officer@bank.com"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Contact Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., 9876543210"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Status
                  </label>
                  <label className="flex items-center gap-2 px-3 py-2 border border-neutral-300 rounded-lg cursor-pointer hover:bg-neutral-50">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-orange-600 border-neutral-300 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm text-neutral-700">Active</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Bank Officer"
                )}
              </button>
              <button
                type="button"
                onClick={() => router.push("/admin/banks")}
                className="px-6 py-2.5 rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors"
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
