"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { IconArrowLeft, IconEdit, IconCheck, IconX } from "@tabler/icons-react";
import { AdminSidebar } from "../../../../../components/admin/AdminSidebar";

interface AdminData {
  name: string;
  email: string;
  img?: string;
  state?: string;
  isVerified: boolean;
  isActive: boolean;
  isSuperAdmin: boolean;
  tenantId?: string;
}

interface RuleSet {
  _id: string;
  name: string;
  description?: string;
  tenantId: string;
  version: number;
  isActive: boolean;
  rules: any;
  createdAt: string;
  updatedAt: string;
}

export default function ViewRuleSetPage() {
  const router = useRouter();
  const params = useParams();
  const rulesetId = params.id as string;
  
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [ruleset, setRuleset] = useState<RuleSet | null>(null);
  const [error, setError] = useState("");

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
        router.push("/admin/signin");
        return;
      }

      setAdminData(data.data);
      await fetchRuleset();
    } catch (error) {
      console.error("Session validation error:", error);
      router.push("/admin/signin");
    }
  };

  const fetchRuleset = async () => {
    try {
      const response = await fetch(`/api/admin/rullset?id=${rulesetId}`);
      const data = await response.json();

      if (data.success && data.data) {
        setRuleset(data.data);
      } else {
        setError("RuleSet not found");
      }
    } catch (err) {
      setError("Error loading ruleset");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderBooleanBadge = (value: boolean) => {
    return value ? (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-100 text-green-700 text-xs font-medium">
        <IconCheck className="h-3 w-3" />
        Enabled
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-100 text-red-700 text-xs font-medium">
        <IconX className="h-3 w-3" />
        Disabled
      </span>
    );
  };

  const renderSection = (title: string, data: any) => {
    if (!data) return null;

    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <h3 className="text-lg font-semibold mb-4 text-orange-600">{title}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="space-y-1">
              <p className="text-sm font-medium text-neutral-500">
                {key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </p>
              <p className="text-sm text-neutral-900">
                {typeof value === "boolean" ? (
                  renderBooleanBadge(value)
                ) : typeof value === "object" && value !== null ? (
                  <span className="text-xs bg-neutral-100 px-2 py-1 rounded">
                    {JSON.stringify(value, null, 2)}
                  </span>
                ) : (
                  String(value)
                )}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading || !adminData) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-600 font-medium">Loading RuleSet...</p>
        </div>
      </div>
    );
  }

  if (error || !ruleset) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <IconX className="h-8 w-8 text-red-600" />
          </div>
          <p className="text-neutral-600 font-medium">{error || "RuleSet not found"}</p>
          <button
            onClick={() => router.push("/admin/rulesets")}
            className="mt-4 px-6 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors"
          >
            Back to RuleSets
          </button>
        </div>
      </div>
    );
  }

  const rules = ruleset.rules || {};

  return (
    <div className="mx-auto flex w-full flex-1 flex-col overflow-hidden bg-white md:flex-row h-screen">
      <AdminSidebar open={open} setOpen={setOpen} adminData={adminData} />

      <div className="flex flex-1 flex-col overflow-auto">
        <div className="flex w-full flex-col gap-4 rounded-tl-2xl border border-neutral-200 bg-white p-4 md:p-8">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/admin/rulesets")}
                className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <IconArrowLeft className="h-5 w-5 text-neutral-700" />
              </button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                  {ruleset.name}
                </h1>
                <p className="text-sm text-neutral-600 mt-1">
                  {ruleset.description || "View verification rules and policies"}
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push(`/admin/rulesets/edit/${rulesetId}`)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors"
            >
              <IconEdit className="h-4 w-4" />
              Edit
            </button>
          </div>

          <div className="space-y-6">
            {/* Basic Information */}
            <div className="rounded-xl border border-neutral-200 bg-white p-6">
              <h3 className="text-lg font-semibold mb-4 text-orange-600">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-neutral-500">Version</p>
                  <p className="text-sm text-neutral-900">v{ruleset.version}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-neutral-500">Status</p>
                  <p className="text-sm text-neutral-900">
                    {ruleset.isActive ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-100 text-green-700 text-xs font-medium">
                        <IconCheck className="h-3 w-3" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-100 text-red-700 text-xs font-medium">
                        <IconX className="h-3 w-3" />
                        Inactive
                      </span>
                    )}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-neutral-500">Created</p>
                  <p className="text-sm text-neutral-900">
                    {new Date(ruleset.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Media Requirements */}
            {rules.media_requirements && renderSection("Media Requirements", rules.media_requirements)}

            {/* GPS Rules */}
            {rules.gps_rules && renderSection("GPS & Location Rules", rules.gps_rules)}

            {/* Time Rules */}
            {rules.time_rules && renderSection("Time & Date Rules", rules.time_rules)}

            {/* Image Quality Rules */}
            {rules.image_quality_rules && renderSection("Image Quality Rules", rules.image_quality_rules)}

            {/* Fraud Detection Rules */}
            {rules.fraud_detection_rules && renderSection("Fraud Detection Rules", rules.fraud_detection_rules)}

            {/* Document Rules */}
            {rules.document_rules && renderSection("Document Rules", rules.document_rules)}

            {/* Asset Rules */}
            {rules.asset_rules && renderSection("Asset Classification Rules", rules.asset_rules)}

            {/* Risk Weights */}
            {rules.risk_weights && (
              <div className="rounded-xl border border-neutral-200 bg-white p-6">
                <h3 className="text-lg font-semibold mb-4 text-orange-600">Risk Weights</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(rules.risk_weights).map(([key, value]) => (
                    <div key={key} className="space-y-1">
                      <p className="text-xs font-medium text-neutral-500">
                        {key.replace(/_/g, " ")}
                      </p>
                      <p className="text-lg font-bold text-orange-600">{String(value)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Thresholds */}
            {rules.thresholds && (
              <div className="rounded-xl border border-neutral-200 bg-white p-6">
                <h3 className="text-lg font-semibold mb-4 text-orange-600">Decision Thresholds</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1 p-4 rounded-lg bg-green-50">
                    <p className="text-sm font-medium text-green-700">Auto Approve Max Risk</p>
                    <p className="text-2xl font-bold text-green-800">
                      {rules.thresholds.auto_approve_max_risk}
                    </p>
                  </div>
                  <div className="space-y-1 p-4 rounded-lg bg-yellow-50">
                    <p className="text-sm font-medium text-yellow-700">Manual Review Min Risk</p>
                    <p className="text-2xl font-bold text-yellow-800">
                      {rules.thresholds.manual_review_min_risk}
                    </p>
                  </div>
                  <div className="space-y-1 p-4 rounded-lg bg-red-50">
                    <p className="text-sm font-medium text-red-700">High Risk Min Risk</p>
                    <p className="text-2xl font-bold text-red-800">
                      {rules.thresholds.high_risk_min_risk}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
