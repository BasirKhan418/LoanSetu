"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconUsers,
  IconPlus,
  IconEdit,
  IconSearch,
  IconRefresh,
  IconFilter,
  IconX,
} from "@tabler/icons-react";
import { cn } from "../../../lib/utils";
import { AdminSidebar } from "../../../components/admin/AdminSidebar";

interface User {
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
  tenantId: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
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

export default function UsersPage() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [filterVerified, setFilterVerified] = useState<"all" | "verified" | "unverified">("all");
  const [filterDistrict, setFilterDistrict] = useState<string>("all");
  const [filterBlock, setFilterBlock] = useState<string>("all");

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
      fetchUsers();
    } catch (error) {
      console.error("Session validation error:", error);
      router.push("/admin/signin");
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
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
        setUsers(data.data || []);
      } else {
        setError(data.message || "Failed to fetch users");
      }
    } catch (err) {
      setError("Error fetching users");
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

  // Get unique districts and blocks for filter dropdowns
  const uniqueDistricts = Array.from(new Set(users.map(u => u.district).filter(Boolean)));
  const uniqueBlocks = Array.from(new Set(users.map(u => u.block).filter(Boolean)));

  // Apply filters
  const filteredUsers = users.filter((user) => {
    // Search filter
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.district?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.block?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.village?.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    const matchesStatus = 
      filterStatus === "all" ||
      (filterStatus === "active" && user.isActive) ||
      (filterStatus === "inactive" && !user.isActive);

    // Verified filter
    const matchesVerified = 
      filterVerified === "all" ||
      (filterVerified === "verified" && user.isVerified) ||
      (filterVerified === "unverified" && !user.isVerified);

    // District filter
    const matchesDistrict = 
      filterDistrict === "all" || user.district === filterDistrict;

    // Block filter
    const matchesBlock = 
      filterBlock === "all" || user.block === filterBlock;

    return matchesSearch && matchesStatus && matchesVerified && matchesDistrict && matchesBlock;
  });

  const clearFilters = () => {
    setFilterStatus("all");
    setFilterVerified("all");
    setFilterDistrict("all");
    setFilterBlock("all");
    setSearchQuery("");
  };

  const activeFilterCount = [
    filterStatus !== "all",
    filterVerified !== "all",
    filterDistrict !== "all",
    filterBlock !== "all",
  ].filter(Boolean).length;

  if (loading && !adminData) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-600 font-medium">Verifying session...</p>
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
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                Users Management
              </h1>
              <p className="text-sm text-neutral-600 mt-1">
                {adminData?.isSuperAdmin 
                  ? "View and manage all users across all states"
                  : `Manage users for ${adminData?.state}`}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors relative",
                  showFilters
                    ? "bg-orange-100 text-orange-700"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                )}
              >
                <IconFilter className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-600 text-white text-xs rounded-full flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              <button
                onClick={fetchUsers}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors"
              >
                <IconRefresh className="h-4 w-4" />
                Refresh
              </button>
              <button
                onClick={() => router.push("/admin/users/add")}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors whitespace-nowrap"
              >
                <IconPlus className="h-4 w-4" />
                Add User
              </button>
            </div>
          </div>

          {/* Alert Messages */}
          {error && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-600">
              {error}
            </div>
          )}

          {!adminData?.isSuperAdmin && (
            <div className="p-4 rounded-lg bg-orange-50 border border-orange-200 text-orange-600">
              You can only manage users for your assigned state ({adminData?.state}).
            </div>
          )}

          {/* Filters Panel */}
          {showFilters && (
            <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-neutral-900">Filter Users</h3>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-orange-600 hover:text-orange-700 flex items-center gap-1"
                  >
                    <IconX className="h-4 w-4" />
                    Clear All
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Status
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Verification
                  </label>
                  <select
                    value={filterVerified}
                    onChange={(e) => setFilterVerified(e.target.value as any)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="all">All Users</option>
                    <option value="verified">Verified</option>
                    <option value="unverified">Unverified</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    District
                  </label>
                  <select
                    value={filterDistrict}
                    onChange={(e) => setFilterDistrict(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="all">All Districts</option>
                    {uniqueDistricts.map((district) => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Block
                  </label>
                  <select
                    value={filterBlock}
                    onChange={(e) => setFilterBlock(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="all">All Blocks</option>
                    {uniqueBlocks.map((block) => (
                      <option key={block} value={block}>
                        {block}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200">
              <p className="text-sm font-medium text-orange-600">Total Users</p>
              <p className="text-2xl font-bold text-orange-700 mt-1">{users.length}</p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
              <p className="text-sm font-medium text-green-600">Active</p>
              <p className="text-2xl font-bold text-green-700 mt-1">
                {users.filter((u) => u.isActive).length}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
              <p className="text-sm font-medium text-blue-600">Verified</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">
                {users.filter((u) => u.isVerified).length}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
              <p className="text-sm font-medium text-purple-600">Filtered Results</p>
              <p className="text-2xl font-bold text-purple-700 mt-1">{filteredUsers.length}</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by name, phone, email, district, block, or village..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* Users Table */}
          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-neutral-600">Loading users...</p>
                </div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <IconUsers className="h-16 w-16 text-neutral-300 mb-4" />
                <p className="text-lg font-medium text-neutral-600 mb-2">
                  {searchQuery || activeFilterCount > 0 ? "No users found" : "No users yet"}
                </p>
                <p className="text-sm text-neutral-500 mb-6">
                  {searchQuery || activeFilterCount > 0
                    ? "Try adjusting your search or filters"
                    : "Get started by adding your first user"}
                </p>
                {!searchQuery && activeFilterCount === 0 && (
                  <button
                    onClick={() => router.push("/admin/users/add")}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors"
                  >
                    <IconPlus className="h-4 w-4" />
                    Add User
                  </button>
                )}
              </div>
            ) : (
              <div className="border border-neutral-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-orange-900">Name</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-orange-900">Contact</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-orange-900">Location</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-orange-900">Address</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-orange-900">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-orange-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user._id} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                              <span className="text-sm font-semibold text-orange-700">
                                {user.name?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="font-medium text-neutral-900">{user.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-neutral-900 font-medium">{user.phone}</p>
                            {user.email && (
                              <p className="text-xs text-neutral-500">{user.email}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-neutral-900">{user.district || "N/A"}</p>
                            <p className="text-xs text-neutral-500">{user.block || "N/A"}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm text-neutral-700 max-w-xs truncate">
                            {user.village || user.addressLine1 || "N/A"}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1">
                            <span
                              className={cn(
                                "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium w-fit",
                                user.isActive
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              )}
                            >
                              {user.isActive ? "Active" : "Inactive"}
                            </span>
                            <span
                              className={cn(
                                "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium w-fit",
                                user.isVerified
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-yellow-100 text-yellow-800"
                              )}
                            >
                              {user.isVerified ? "Verified" : "Unverified"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => router.push(`/admin/users/edit/${user._id}`)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors text-sm"
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
    </div>
  );
}
