"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function StateOfficerDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [officerData, setOfficerData] = useState<any>(null);

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

      if (!data.success || data.type !== "stateofficer") {
        router.push("/stateofficer/signin");
        return;
      }

      if (!data.data.isVerified) {
        router.push("/stateofficer/signin?error=not-verified");
        return;
      }

      if (!data.data.isActive) {
        router.push("/stateofficer/signin?error=account-inactive");
        return;
      }

      setOfficerData(data.data);
      setLoading(false);
    } catch (error) {
      console.error("Session validation error:", error);
      router.push("/stateofficer/signin");
    }
  };

  const handleSignOut = () => {
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    router.push("/stateofficer/signin");
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg border border-neutral-200 p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                State Officer Dashboard
              </h1>
              <p className="text-neutral-600">
                Welcome back, {officerData?.name}
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
            <div className="p-6 rounded-lg bg-blue-50 border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">Your Details</h3>
              <div className="space-y-1 text-sm text-blue-700">
                <p><strong>Email:</strong> {officerData?.email}</p>
                <p><strong>Phone:</strong> {officerData?.phone}</p>
                <p><strong>State:</strong> {officerData?.state}</p>
                {officerData?.designation && (
                  <p><strong>Designation:</strong> {officerData.designation}</p>
                )}
                {officerData?.department && (
                  <p><strong>Department:</strong> {officerData.department}</p>
                )}
              </div>
            </div>

            <div className="p-6 rounded-lg bg-green-50 border border-green-200">
              <h3 className="font-semibold text-green-900 mb-2">Permissions</h3>
              <div className="space-y-1 text-sm text-green-700">
                <p>✓ Review Submissions: {officerData?.canReviewSubmissions ? "Yes" : "No"}</p>
                <p>✓ Approve Applications: {officerData?.canApprove ? "Yes" : "No"}</p>
                <p>✓ Account Status: {officerData?.isActive ? "Active" : "Inactive"}</p>
                <p>✓ Verification: {officerData?.isVerified ? "Verified" : "Pending"}</p>
              </div>
            </div>

            <div className="p-6 rounded-lg bg-purple-50 border border-purple-200">
              <h3 className="font-semibold text-purple-900 mb-2">Quick Stats</h3>
              <div className="space-y-1 text-sm text-purple-700">
                <p>Pending Reviews: Coming soon</p>
                <p>Approved: Coming soon</p>
                <p>Rejected: Coming soon</p>
              </div>
            </div>
          </div>

          <div className="mt-8 p-6 rounded-lg bg-neutral-50 border border-neutral-200">
            <h3 className="font-semibold text-neutral-900 mb-3">
              Dashboard Under Development
            </h3>
            <p className="text-neutral-600 text-sm">
              This is a placeholder dashboard. Full functionality including loan review,
              approval workflows, and reporting features are currently under development.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
