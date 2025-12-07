"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  IconBuilding,
  IconDeviceFloppy,
  IconArrowLeft,
} from "@tabler/icons-react";
import { cn } from "../../../../../lib/utils";
import { AdminSidebar } from "../../../../../components/admin/AdminSidebar";

interface TenantFormData {
  code: string;
  name: string;
  state: string;
  district: string;
  email: string;
  phone: string;
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
}

export default function EditTenantPage() {
  const router = useRouter();
  const params = useParams();
  const tenantId = params.id as string;
  
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [formData, setFormData] = useState<TenantFormData>({
    code: "",
    name: "",
    state: "",
    district: "",
    email: "",
    phone: "",
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

      // Check if user is super admin
      if (!data.data.isSuperAdmin) {
        router.push("/admin/tenants");
        return;
      }

      setAdminData(data.data);
      fetchTenantData();
    } catch (error) {
      console.error("Session validation error:", error);
      router.push("/admin/signin");
    }
  };

  const fetchTenantData = async () => {
    try {
      const response = await fetch(`/api/tenant?id=${tenantId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      
      if (data.success && data.data) {
        const tenant = data.data;
        setFormData({
          code: tenant.code || "",
          name: tenant.name || "",
          state: tenant.state || "",
          district: tenant.district || "",
          email: tenant.email || "",
          phone: tenant.phone || "",
          isActive: tenant.isActive ?? true,
        });
      } else {
        setError("Tenant not found");
      }
    } catch (err) {
      setError("Error fetching tenant data");
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch("/api/tenant", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: tenantId, ...formData }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/admin/tenants");
        }, 2000);
      } else {
        setError(data.message || "Failed to update tenant");
      }
    } catch (err) {
      setError("Error updating tenant. Please try again.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const indianStates = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
  ];

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-600 font-medium">Loading tenant data...</p>
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
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push("/admin/tenants")}
                  className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
                >
                  <IconArrowLeft className="h-5 w-5 text-neutral-700" />
                </button>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                    Edit Tenant
                  </h1>
                  <p className="text-sm text-neutral-600 mt-1">
                    Update tenant information
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-50 text-orange-600">
              <IconBuilding className="h-5 w-5" />
              <span className="font-medium">Tenant Management</span>
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
              Tenant updated successfully! Redirecting...
            </div>
          )}

          {/* Form */}
          <div className="flex-1 overflow-auto">
            <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
              {/* Basic Information */}
              <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4">
                  Basic Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="code"
                      className="block text-sm font-medium text-neutral-700 mb-2"
                    >
                      Tenant Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="code"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g., TN001"
                      className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-neutral-700 mb-2"
                    >
                      Tenant Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter tenant name"
                      className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="state"
                      className="block text-sm font-medium text-neutral-700 mb-2"
                    >
                      State <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select State</option>
                      {indianStates.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="district"
                      className="block text-sm font-medium text-neutral-700 mb-2"
                    >
                      District
                    </label>
                    <input
                      type="text"
                      id="district"
                      name="district"
                      value={formData.district}
                      onChange={handleInputChange}
                      placeholder="Enter district"
                      className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4">
                  Contact Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-neutral-700 mb-2"
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="tenant@example.com"
                      className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium text-neutral-700 mb-2"
                    >
                      Phone
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+91 1234567890"
                      className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4">
                  Status
                </h2>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="h-4 w-4 rounded border-neutral-300 text-orange-600 focus:ring-orange-500"
                  />
                  <label
                    htmlFor="isActive"
                    className="text-sm font-medium text-neutral-700"
                  >
                    Active Tenant
                  </label>
                </div>
                <p className="text-xs text-neutral-500 mt-2 ml-7">
                  Only active tenants can access the system
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => router.push("/admin/tenants")}
                  className="px-6 py-2 rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={cn(
                    "flex items-center gap-2 px-6 py-2 rounded-lg bg-orange-600 text-white transition-colors",
                    submitting
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-orange-700"
                  )}
                >
                  {submitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <IconDeviceFloppy className="h-4 w-4" />
                      Update Tenant
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
