"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  IconUserShield,
  IconDeviceFloppy,
  IconArrowLeft,
} from "@tabler/icons-react";
import { cn } from "../../../../../lib/utils";
import { AdminSidebar } from "../../../../../components/admin/AdminSidebar";

interface OfficerFormData {
  name: string;
  email: string;
  phone: string;
  designation: string;
  department: string;
  state: string;
  district: string;
  block: string;
  tenantId: string;
  canReviewSubmissions: boolean;
  canApprove: boolean;
  isActive: boolean;
  isVerified: boolean;
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
  name: string; // This is the state name (e.g., "Odisha")
  logoUrl?: string;
  isActive: boolean;
}

export default function EditOfficerPage() {
  const router = useRouter();
  const params = useParams();
  const officerId = params.id as string;
  
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingTenants, setLoadingTenants] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [formData, setFormData] = useState<OfficerFormData>({
    name: "",
    email: "",
    phone: "",
    designation: "",
    department: "",
    state: "",
    district: "",
    block: "",
    tenantId: "",
    canReviewSubmissions: true,
    canApprove: true,
    isActive: true,
    isVerified: false,
  });

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
      
      // Fetch officer data first
      await fetchOfficerData();
      
      // If super admin, fetch tenants
      if (data.data.isSuperAdmin) {
        await fetchTenants();
      }
    } catch (error) {
      console.error("Session validation error:", error);
      router.push("/admin/signin");
    }
  };

  const fetchOfficerData = async () => {
    try {
      const response = await fetch("/api/stateofficerauth", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      const data = await response.json();
      
      if (data.success) {
        const officer = data.data.find((o: any) => o._id === officerId);
        if (officer) {
          setFormData({
            name: officer.name || "",
            email: officer.email || "",
            phone: officer.phone || "",
            designation: officer.designation || "",
            department: officer.department || "",
            state: officer.state || "",
            district: officer.district || "",
            block: officer.block || "",
            tenantId: officer.tenantId || "",
            canReviewSubmissions: officer.canReviewSubmissions ?? true,
            canApprove: officer.canApprove ?? true,
            isActive: officer.isActive ?? true,
            isVerified: officer.isVerified ?? false,
          });
        } else {
          setError("Officer not found");
        }
      } else {
        setError(data.message || "Failed to fetch officer data");
      }
    } catch (err) {
      setError("Error fetching officer data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTenants = async () => {
    setLoadingTenants(true);
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
      } else {
        setError("Failed to fetch tenants");
      }
    } catch (err) {
      console.error("Error fetching tenants:", err);
      setError("Error loading tenants list");
    } finally {
      setLoadingTenants(false);
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

  const handleTenantChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tenantId = e.target.value;
    const selectedTenant = tenants.find(t => t._id === tenantId);
    
    if (selectedTenant) {
      setFormData((prev) => ({
        ...prev,
        tenantId,
        state: selectedTenant.name, // Use tenant.name as state (e.g., "Odisha")
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
    
    // Validate required fields
    if (!formData.tenantId || !formData.state) {
      setError("Please select a tenant/state");
      return;
    }
    
    if (!formData.name || !formData.email || !formData.phone) {
      setError("Please fill in all required fields");
      return;
    }
    
    setSubmitting(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch("/api/stateofficerauth", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: officerId,
          ...formData,
        }),
        credentials: "include",
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/admin/officers");
        }, 2000);
      } else {
        setError(data.message || "Failed to update state officer");
      }
    } catch (err) {
      setError("Error updating state officer. Please try again.");
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
          <p className="text-neutral-600 font-medium">Loading officer data...</p>
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
                  onClick={() => router.push("/admin/officers")}
                  className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
                >
                  <IconArrowLeft className="h-5 w-5 text-neutral-700" />
                </button>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                    Edit State Officer
                  </h1>
                  <p className="text-sm text-neutral-600 mt-1">
                    Update officer information
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-50 text-purple-600">
              <IconUserShield className="h-5 w-5" />
              <span className="font-medium">Officer Management</span>
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
              State officer updated successfully! Redirecting...
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
                      htmlFor="name"
                      className="block text-sm font-medium text-neutral-700 mb-2"
                    >
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter officer name"
                      className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-neutral-700 mb-2"
                    >
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="officer@example.com"
                      className="w-full px-4 py-2 rounded-lg border border-neutral-200 bg-neutral-50 focus:outline-none"
                      readOnly
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium text-neutral-700 mb-2"
                    >
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      placeholder="1234567890"
                      pattern="[0-9]{10}"
                      className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <p className="text-xs text-neutral-500 mt-1">
                      Enter 10-digit mobile number
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="designation"
                      className="block text-sm font-medium text-neutral-700 mb-2"
                    >
                      Designation
                    </label>
                    <input
                      type="text"
                      id="designation"
                      name="designation"
                      value={formData.designation}
                      onChange={handleInputChange}
                      placeholder="e.g., Assistant Director"
                      className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label
                      htmlFor="department"
                      className="block text-sm font-medium text-neutral-700 mb-2"
                    >
                      Department
                    </label>
                    <input
                      type="text"
                      id="department"
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      placeholder="e.g., Agriculture, MSME"
                      className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Jurisdiction Information */}
              <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4">
                  Jurisdiction
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {adminData?.isSuperAdmin ? (
                    <>
                      <div className="md:col-span-2">
                        <label
                          htmlFor="tenantId"
                          className="block text-sm font-medium text-neutral-700 mb-2"
                        >
                          Tenant <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="tenantId"
                          name="tenantId"
                          value={formData.tenantId}
                          onChange={handleTenantChange}
                          required
                          disabled={loadingTenants}
                          className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-neutral-50 disabled:cursor-not-allowed"
                        >
                          <option value="">{loadingTenants ? "Loading tenants..." : "Select Tenant"}</option>
                          {tenants.map((tenant) => (
                            <option key={tenant._id} value={tenant._id}>
                              {tenant.name} ({tenant.code})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="state"
                          className="block text-sm font-medium text-neutral-700 mb-2"
                        >
                          State <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="state"
                          name="state"
                          value={formData.state || ""}
                          readOnly
                          className="w-full px-4 py-2 rounded-lg border border-neutral-200 bg-neutral-50 focus:outline-none cursor-not-allowed"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="md:col-span-2">
                      <label
                        htmlFor="state"
                        className="block text-sm font-medium text-neutral-700 mb-2"
                      >
                        State <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="state"
                        name="state"
                        value={formData.state || ""}
                        readOnly
                        className="w-full px-4 py-2 rounded-lg border border-neutral-200 bg-neutral-50 focus:outline-none cursor-not-allowed"
                      />
                      <p className="text-xs text-neutral-500 mt-1">
                        You can only create officers for your assigned state
                      </p>
                    </div>
                  )}

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

                  <div>
                    <label
                      htmlFor="block"
                      className="block text-sm font-medium text-neutral-700 mb-2"
                    >
                      Block
                    </label>
                    <input
                      type="text"
                      id="block"
                      name="block"
                      value={formData.block}
                      onChange={handleInputChange}
                      placeholder="Enter block"
                      className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Permissions */}
              <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4">
                  Permissions & Status
                </h2>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="canReviewSubmissions"
                      name="canReviewSubmissions"
                      checked={formData.canReviewSubmissions}
                      onChange={handleInputChange}
                      className="h-4 w-4 rounded border-neutral-300 text-orange-600 focus:ring-orange-500 mt-0.5"
                    />
                    <div>
                      <label
                        htmlFor="canReviewSubmissions"
                        className="text-sm font-medium text-neutral-700 cursor-pointer"
                      >
                        Can Review Submissions
                      </label>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Allow officer to review loan applications and submissions
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="canApprove"
                      name="canApprove"
                      checked={formData.canApprove}
                      onChange={handleInputChange}
                      className="h-4 w-4 rounded border-neutral-300 text-orange-600 focus:ring-orange-500 mt-0.5"
                    />
                    <div>
                      <label
                        htmlFor="canApprove"
                        className="text-sm font-medium text-neutral-700 cursor-pointer"
                      >
                        Can Approve Applications
                      </label>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Grant approval authority for loan applications
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="isActive"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      className="h-4 w-4 rounded border-neutral-300 text-orange-600 focus:ring-orange-500 mt-0.5"
                    />
                    <div>
                      <label
                        htmlFor="isActive"
                        className="text-sm font-medium text-neutral-700 cursor-pointer"
                      >
                        Active Officer
                      </label>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Only active officers can access the system
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="isVerified"
                      name="isVerified"
                      checked={formData.isVerified}
                      onChange={handleInputChange}
                      className="h-4 w-4 rounded border-neutral-300 text-orange-600 focus:ring-orange-500 mt-0.5"
                    />
                    <div>
                      <label
                        htmlFor="isVerified"
                        className="text-sm font-medium text-neutral-700 cursor-pointer"
                      >
                        Verified Officer
                      </label>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Mark officer as verified and approved
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => router.push("/admin/officers")}
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
                      Update Officer
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
