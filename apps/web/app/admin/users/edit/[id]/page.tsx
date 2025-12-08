"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  IconUser,
  IconDeviceFloppy,
  IconArrowLeft,
  IconMapPin,
  IconPhone,
  IconMail,
} from "@tabler/icons-react";
import { cn } from "../../../../../lib/utils";
import { AdminSidebar } from "../../../../../components/admin/AdminSidebar";

interface UserFormData {
  name: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  village: string;
  block: string;
  district: string;
  state: string;
  pincode: string;
  tenantId: string;
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
  name: string;
  logoUrl?: string;
  isActive: boolean;
}

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [formData, setFormData] = useState<UserFormData>({
    name: "",
    phone: "",
    email: "",
    addressLine1: "",
    addressLine2: "",
    village: "",
    block: "",
    district: "",
    state: "",
    pincode: "",
    tenantId: "",
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
      
      // Fetch user data first
      await fetchUserData();
      
      // If super admin, fetch tenants
      if (data.data.isSuperAdmin) {
        await fetchTenants();
      }
    } catch (error) {
      console.error("Session validation error:", error);
      router.push("/admin/signin");
    }
  };

  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/userauth", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      const data = await response.json();
      
      if (data.success) {
        const user = data.data.find((u: any) => u._id === userId);
        if (user) {
          setFormData({
            name: user.name || "",
            phone: user.phone || "",
            email: user.email || "",
            addressLine1: user.addressLine1 || "",
            addressLine2: user.addressLine2 || "",
            village: user.village || "",
            block: user.block || "",
            district: user.district || "",
            state: user.state || "",
            pincode: user.pincode || "",
            tenantId: user.tenantId || "",
            isActive: user.isActive ?? true,
            isVerified: user.isVerified ?? false,
          });
        } else {
          setError("User not found");
        }
      } else {
        setError(data.message || "Failed to fetch user data");
      }
    } catch (err) {
      setError("Error fetching user data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTenants = async () => {
    try {
      const response = await fetch("/api/admin/tenant", {
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
    
    if (!formData.tenantId || !formData.state) {
      setError("Please select a tenant/state");
      return;
    }
    
    if (!formData.name || !formData.phone) {
      setError("Please fill in all required fields");
      return;
    }

    // Validate phone number (10 digits)
    if (!/^\d{10}$/.test(formData.phone)) {
      setError("Phone number must be exactly 10 digits");
      return;
    }

    // Validate pincode (6 digits)
    if (formData.pincode && !/^\d{6}$/.test(formData.pincode)) {
      setError("Pincode must be exactly 6 digits");
      return;
    }
    
    setSubmitting(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch("/api/userauth", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          _id: userId,
          ...formData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/admin/users");
        }, 2000);
      } else {
        setError(data.message || "Failed to update user");
      }
    } catch (err) {
      setError("Error updating user. Please try again.");
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
          <p className="text-neutral-600 font-medium">Loading user data...</p>
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
                onClick={() => router.push("/admin/users")}
                className="p-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 transition-colors"
              >
                <IconArrowLeft className="h-5 w-5 text-neutral-700" />
              </button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                  Edit User
                </h1>
                <p className="text-sm text-neutral-600 mt-1">
                  Update user information
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
              User updated successfully! Redirecting...
            </div>
          )}

          {!adminData?.isSuperAdmin && (
            <div className="p-4 rounded-lg bg-orange-50 border border-orange-200 text-orange-600">
              You are editing a user for {adminData?.state}.
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto">
            {/* Personal Details Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                <IconUser className="h-5 w-5 text-orange-600" />
                Personal Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., Rajesh Kumar"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    <IconPhone className="h-4 w-4 inline mr-1" />
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    maxLength={10}
                    placeholder="e.g., 9876543210"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    10-digit mobile number (used for OTP login)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    <IconMail className="h-4 w-4 inline mr-1" />
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="e.g., user@example.com"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Address Details Section */}
            <div className="space-y-4 pt-4 border-t border-neutral-200">
              <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                <IconMapPin className="h-5 w-5 text-orange-600" />
                Address Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Address Line 1
                  </label>
                  <input
                    type="text"
                    name="addressLine1"
                    value={formData.addressLine1}
                    onChange={handleInputChange}
                    placeholder="House/Building number, Street name"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    name="addressLine2"
                    value={formData.addressLine2}
                    onChange={handleInputChange}
                    placeholder="Landmark, Area"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Village/Town
                  </label>
                  <input
                    type="text"
                    name="village"
                    value={formData.village}
                    onChange={handleInputChange}
                    placeholder="e.g., Bhubaneswar"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Block
                  </label>
                  <input
                    type="text"
                    name="block"
                    value={formData.block}
                    onChange={handleInputChange}
                    placeholder="e.g., Bhubaneswar"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    District
                  </label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleInputChange}
                    placeholder="e.g., Khordha"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Pincode
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    maxLength={6}
                    placeholder="e.g., 751001"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
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
              </div>
            </div>

            {/* Status Section */}
            <div className="space-y-4 pt-4 border-t border-neutral-200">
              <h2 className="text-lg font-semibold text-neutral-900">Account Status</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 px-3 py-2 border border-neutral-300 rounded-lg cursor-pointer hover:bg-neutral-50">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-orange-600 border-neutral-300 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm text-neutral-700">Account Active</span>
                  </label>
                </div>

                <div>
                  <label className="flex items-center gap-2 px-3 py-2 border border-neutral-300 rounded-lg cursor-pointer hover:bg-neutral-50">
                    <input
                      type="checkbox"
                      name="isVerified"
                      checked={formData.isVerified}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-orange-600 border-neutral-300 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm text-neutral-700">Verified User</span>
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
                    Updating...
                  </>
                ) : (
                  <>
                    <IconDeviceFloppy className="h-4 w-4" />
                    Update User
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => router.push("/admin/users")}
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
