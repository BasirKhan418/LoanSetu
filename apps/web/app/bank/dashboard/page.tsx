"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function BankDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [bankData, setBankData] = useState<any>(null);

  useEffect(() => {
    validateSession();
  }, []);

  const validateSession = async () => {
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

      if (!data.data.isActive) {
        router.push("/bank/signin?error=account-inactive");
        return;
      }

      setBankData(data.data);
      setLoading(false);
    } catch (error) {
      console.error("Session validation error:", error);
      router.push("/bank/signin");
    }
  };

  const handleSignOut = () => {
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    router.push("/bank/signin");
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg border border-neutral-200 p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                Bank Officer Dashboard
              </h1>
              <p className="text-neutral-600">
                Welcome, {bankData?.contactName}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 rounded-lg bg-red-50 text-red-600 font-medium hover:bg-red-100 transition-colors"
            >
              Sign Out
            </button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="p-6 rounded-lg bg-purple-50 border border-purple-200">
              <h3 className="font-semibold text-purple-900 mb-2">Bank Details</h3>
              <div className="space-y-1 text-sm text-purple-700">
                <p><strong>Bank:</strong> {bankData?.name}</p>
                <p><strong>Branch:</strong> {bankData?.branchName}</p>
                <p><strong>IFSC:</strong> {bankData?.ifsc}</p>
                {bankData?.state && (
                  <p><strong>State:</strong> {bankData.state}</p>
                )}
                {bankData?.district && (
                  <p><strong>District:</strong> {bankData.district}</p>
                )}
              </div>
            </div>

            <div className="p-6 rounded-lg bg-green-50 border border-green-200">
              <h3 className="font-semibold text-green-900 mb-2">Contact Information</h3>
              <div className="space-y-1 text-sm text-green-700">
                <p><strong>Officer:</strong> {bankData?.contactName}</p>
                <p><strong>Email:</strong> {bankData?.contactEmail}</p>
                {bankData?.contactPhone && (
                  <p><strong>Phone:</strong> {bankData.contactPhone}</p>
                )}
                <p><strong>Status:</strong> {bankData?.isActive ? "Active" : "Inactive"}</p>
              </div>
            </div>

            <div className="p-6 rounded-lg bg-blue-50 border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">Quick Stats</h3>
              <div className="space-y-1 text-sm text-blue-700">
                <p>Active Loans: Coming soon</p>
                <p>Verified: Coming soon</p>
                <p>Pending: Coming soon</p>
              </div>
            </div>
          </div>

          <div className="mt-8 p-6 rounded-lg bg-neutral-50 border border-neutral-200">
            <h3 className="font-semibold text-neutral-900 mb-3">
              Dashboard Under Development
            </h3>
            <p className="text-neutral-600 text-sm">
              This is a placeholder dashboard. Full functionality including loan tracking,
              verification management, and reporting features are currently under development.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
