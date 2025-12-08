"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "../../../lib/utils";
import { StateOfficerSidebar } from "../../../components/stateofficer/StateOfficerSidebar";
import {
  IconClipboardCheck,
  IconFileCheck,
  IconAlertCircle,
  IconRefresh,
} from "@tabler/icons-react";

export default function StateOfficerDashboard() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
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
          <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statsCards = [
    {
      title: "Pending Reviews",
      value: 0,
      icon: <IconClipboardCheck className="h-6 w-6" />,
      color: "from-orange-500 to-orange-600",
    },
    {
      title: "Approved",
      value: 0,
      icon: <IconFileCheck className="h-6 w-6" />,
      color: "from-green-500 to-green-600",
    },
    {
      title: "Needs Attention",
      value: 0,
      icon: <IconAlertCircle className="h-6 w-6" />,
      color: "from-blue-500 to-blue-600",
    },
  ];

  return (
    <div
      className={cn(
        "mx-auto flex w-full flex-1 flex-col overflow-hidden bg-white md:flex-row",
        "h-screen"
      )}
    >
      <StateOfficerSidebar open={open} setOpen={setOpen} officerData={officerData || undefined} />
      <div className="flex flex-1 flex-col">
        <div className="flex h-full w-full flex-1 flex-col gap-4 rounded-tl-2xl border border-neutral-200 bg-white p-4 md:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-neutral-200">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                State Officer Dashboard
              </h1>
              <p className="text-sm text-neutral-600 mt-1">
                Welcome back, {officerData?.name}
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors"
            >
              <IconRefresh className="h-4 w-4" />
              Refresh
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {statsCards.map((stat, idx) => (
              <div
                key={idx}
                className="relative overflow-hidden rounded-xl bg-gradient-to-br p-[1px] shadow-lg"
              >
                <div className={cn("absolute inset-0 bg-gradient-to-br", stat.color)} />
                <div className="relative rounded-xl bg-white p-6 backdrop-blur">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-neutral-600">{stat.title}</p>
                      <p className="text-3xl font-bold text-neutral-900 mt-2">{stat.value}</p>
                    </div>
                    <div className={cn("p-3 rounded-full bg-gradient-to-br text-white", stat.color)}>
                      {stat.icon}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Officer Details */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Your Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Email:</span>
                  <span className="font-medium text-neutral-900">{officerData?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Phone:</span>
                  <span className="font-medium text-neutral-900">{officerData?.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">State:</span>
                  <span className="font-medium text-neutral-900">{officerData?.state}</span>
                </div>
                {officerData?.designation && (
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Designation:</span>
                    <span className="font-medium text-neutral-900">{officerData.designation}</span>
                  </div>
                )}
                {officerData?.department && (
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Department:</span>
                    <span className="font-medium text-neutral-900">{officerData.department}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Permissions</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "h-2 w-2 rounded-full",
                    officerData?.canReviewSubmissions ? "bg-green-500" : "bg-red-500"
                  )} />
                  <span className="text-neutral-700">Review Submissions</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "h-2 w-2 rounded-full",
                    officerData?.canApprove ? "bg-green-500" : "bg-red-500"
                  )} />
                  <span className="text-neutral-700">Approve Applications</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "h-2 w-2 rounded-full",
                    officerData?.isActive ? "bg-green-500" : "bg-red-500"
                  )} />
                  <span className="text-neutral-700">Account Active</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "h-2 w-2 rounded-full",
                    officerData?.isVerified ? "bg-green-500" : "bg-yellow-500"
                  )} />
                  <span className="text-neutral-700">Verified Account</span>
                </div>
              </div>
            </div>
          </div>

          {/* Info Banner */}
          <div className="rounded-xl border border-orange-200 bg-orange-50 p-6">
            <h3 className="font-semibold text-orange-900 mb-2">
              Dashboard Under Development
            </h3>
            <p className="text-orange-700 text-sm">
              Full functionality including loan review, approval workflows, and reporting features are currently under development.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
