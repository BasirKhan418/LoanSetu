c"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IconArrowLeft, IconDeviceFloppy } from "@tabler/icons-react";
import { cn } from "../../../../lib/utils";
import { AdminSidebar } from "../../../../components/admin/AdminSidebar";

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

interface Tenant {
  _id: string;
  name: string;
  state: string;
}

export default function AddRuleSetPage() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Basic fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [version, setVersion] = useState(1);
  const [isActive, setIsActive] = useState(true);

  // Rule toggles
  const [enableMediaRequirements, setEnableMediaRequirements] = useState(false);
  const [enableGpsRules, setEnableGpsRules] = useState(false);
  const [enableTimeRules, setEnableTimeRules] = useState(false);
  const [enableImageQuality, setEnableImageQuality] = useState(false);
  const [enableFraudDetection, setEnableFraudDetection] = useState(false);
  const [enableDocumentRules, setEnableDocumentRules] = useState(false);
  const [enableAssetRules, setEnableAssetRules] = useState(false);
  const [enableRiskWeights, setEnableRiskWeights] = useState(false);
  const [enableThresholds, setEnableThresholds] = useState(false);

  // Media Requirements
  const [minPhotos, setMinPhotos] = useState(4);
  const [minVideoSeconds, setMinVideoSeconds] = useState(10);

  // GPS Rules
  const [maxDistanceKm, setMaxDistanceKm] = useState(5);
  const [requireExifGps, setRequireExifGps] = useState(true);
  const [mockLocationBlock, setMockLocationBlock] = useState(true);

  // Time Rules
  const [maxDaysAfterSanction, setMaxDaysAfterSanction] = useState(30);
  const [allowBeforeSanction, setAllowBeforeSanction] = useState(false);

  // Image Quality
  const [maxBlurVariance, setMaxBlurVariance] = useState(120);
  const [minWidth, setMinWidth] = useState(800);
  const [minHeight, setMinHeight] = useState(600);
  const [rejectScreenshots, setRejectScreenshots] = useState(true);
  const [rejectPrintedPhotos, setRejectPrintedPhotos] = useState(true);

  // Fraud Detection
  const [duplicateDetection, setDuplicateDetection] = useState(true);
  const [maxHashDistance, setMaxHashDistance] = useState(8);
  const [elaTamperingCheck, setElaTamperingCheck] = useState(true);
  const [aiGeneratedDetection, setAiGeneratedDetection] = useState(true);
  const [printedPhotoDetection, setPrintedPhotoDetection] = useState(true);

  // Document Rules
  const [requireInvoice, setRequireInvoice] = useState(true);
  const [invoiceOcrMatchAmount, setInvoiceOcrMatchAmount] = useState(true);
  const [invoiceOcrMatchDate, setInvoiceOcrMatchDate] = useState(true);

  // Asset Rules
  const [assetTypes, setAssetTypes] = useState("TRACTOR");
  const [classifierRequired, setClassifierRequired] = useState(true);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.80);

  // Risk Weights
  const [riskWeights, setRiskWeights] = useState({
    GPS_MISMATCH: 25,
    EXIF_MISSING: 20,
    TIME_MISMATCH: 15,
    DUPLICATE_IMAGE: 35,
    UNKNOWN_ASSET: 30,
    ELA_TAMPERED: 30,
    AI_GENERATED: 40,
    INVOICE_MISSING: 20,
    LOW_QUALITY: 15,
    PRINTED_PHOTO_DETECTED: 25,
    SCREENSHOT_DETECTED: 20,
  });

  // Thresholds
  const [autoApproveMaxRisk, setAutoApproveMaxRisk] = useState(20);
  const [manualReviewMinRisk, setManualReviewMinRisk] = useState(21);
  const [highRiskMinRisk, setHighRiskMinRisk] = useState(60);

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
      setTenantId(data.data.tenantId || "");
      
      // Fetch tenants for super admin
      if (data.data.isSuperAdmin) {
        fetchTenants();
      }
    } catch (error) {
      console.error("Session validation error:", error);
      router.push("/admin/signin");
    }
  };

  const fetchTenants = async () => {
    try {
      const response = await fetch("/api/tenant");
      const data = await response.json();
      if (data.success) {
        setTenants(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching tenants:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const rules: any = {};

      if (enableMediaRequirements) {
        rules.media_requirements = {
          min_photos: minPhotos,
          min_video_seconds: minVideoSeconds,
          allowed_mime_types: ["image/jpeg", "image/png", "video/mp4"],
        };
      }

      if (enableGpsRules) {
        rules.gps_rules = {
          max_distance_km: maxDistanceKm,
          require_exif_gps: requireExifGps,
          mock_location_block: mockLocationBlock,
        };
      }

      if (enableTimeRules) {
        rules.time_rules = {
          max_days_after_sanction: maxDaysAfterSanction,
          allow_before_sanction: allowBeforeSanction,
        };
      }

      if (enableImageQuality) {
        rules.image_quality_rules = {
          max_blur_variance: maxBlurVariance,
          min_resolution: {
            width: minWidth,
            height: minHeight,
          },
          reject_screenshots: rejectScreenshots,
          reject_printed_photos: rejectPrintedPhotos,
        };
      }

      if (enableFraudDetection) {
        rules.fraud_detection_rules = {
          duplicate_detection: duplicateDetection,
          max_hash_distance: maxHashDistance,
          ela_tampering_check: elaTamperingCheck,
          ai_generated_detection: aiGeneratedDetection,
          printed_photo_detection: printedPhotoDetection,
        };
      }

      if (enableDocumentRules) {
        rules.document_rules = {
          require_invoice: requireInvoice,
          invoice_ocr_match_amount: invoiceOcrMatchAmount,
          invoice_ocr_match_date: invoiceOcrMatchDate,
        };
      }

      if (enableAssetRules) {
        rules.asset_rules = {
          allowed_asset_types: assetTypes.split(",").map((t) => t.trim()),
          classifier_required: classifierRequired,
          confidence_threshold: confidenceThreshold,
        };
      }

      if (enableRiskWeights) {
        rules.risk_weights = riskWeights;
      }

      if (enableThresholds) {
        rules.thresholds = {
          auto_approve_max_risk: autoApproveMaxRisk,
          manual_review_min_risk: manualReviewMinRisk,
          high_risk_min_risk: highRiskMinRisk,
        };
      }

      const payload = {
        name,
        description,
        tenantId,
        version,
        isActive,
        rules,
      };

      const response = await fetch("/api/admin/rullset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("RuleSet created successfully!");
        setTimeout(() => router.push("/admin/rulesets"), 1500);
      } else {
        setError(data.message || "Failed to create ruleset");
      }
    } catch (err) {
      setError("Error creating ruleset");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!adminData) {
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
      <AdminSidebar open={open} setOpen={setOpen} adminData={adminData} />

      <div className="flex flex-1 flex-col overflow-auto">
        <div className="flex w-full flex-col gap-4 rounded-tl-2xl border border-neutral-200 bg-white p-4 md:p-8">
          {/* Header */}
          <div className="flex items-center gap-4 pb-4 border-b border-neutral-200">
            <button
              onClick={() => router.push("/admin/rulesets")}
              className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <IconArrowLeft className="h-5 w-5 text-neutral-700" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                Add New RuleSet
              </h1>
              <p className="text-sm text-neutral-600 mt-1">
                Create verification rules and policies
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="rounded-xl border border-neutral-200 bg-white p-6">
              <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="PMEGP Tractor Verification – Odisha 2025"
                  />
                </div>

                {adminData.isSuperAdmin && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Tenant *
                    </label>
                    <select
                      value={tenantId}
                      onChange={(e) => setTenantId(e.target.value)}
                      required
                      className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select Tenant</option>
                      {tenants.map((tenant) => (
                        <option key={tenant._id} value={tenant._id}>
                          {tenant.name} ({tenant.state})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Version
                  </label>
                  <input
                    type="number"
                    value={version}
                    onChange={(e) => setVersion(Number(e.target.value))}
                    min="1"
                    className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
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

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Official RuleSet for validating tractor purchase..."
                  />
                </div>
              </div>
            </div>

            {/* Media Requirements */}
            <div className="rounded-xl border border-neutral-200 bg-white p-6">
              <div className="flex items-center gap-3 mb-4">
                <input
                  type="checkbox"
                  id="enableMedia"
                  checked={enableMediaRequirements}
                  onChange={(e) => setEnableMediaRequirements(e.target.checked)}
                  className="w-4 h-4 text-orange-600 border-neutral-300 rounded focus:ring-orange-500"
                />
                <label htmlFor="enableMedia" className="text-lg font-semibold">
                  Media Requirements
                </label>
              </div>

              {enableMediaRequirements && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Minimum Photos
                    </label>
                    <input
                      type="number"
                      value={minPhotos}
                      onChange={(e) => setMinPhotos(Number(e.target.value))}
                      min="1"
                      className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Minimum Video Duration (seconds)
                    </label>
                    <input
                      type="number"
                      value={minVideoSeconds}
                      onChange={(e) => setMinVideoSeconds(Number(e.target.value))}
                      min="0"
                      className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* GPS Rules */}
            <div className="rounded-xl border border-neutral-200 bg-white p-6">
              <div className="flex items-center gap-3 mb-4">
                <input
                  type="checkbox"
                  id="enableGps"
                  checked={enableGpsRules}
                  onChange={(e) => setEnableGpsRules(e.target.checked)}
                  className="w-4 h-4 text-orange-600 border-neutral-300 rounded focus:ring-orange-500"
                />
                <label htmlFor="enableGps" className="text-lg font-semibold">
                  GPS & Location Rules
                </label>
              </div>

              {enableGpsRules && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Max Distance (KM)
                    </label>
                    <input
                      type="number"
                      value={maxDistanceKm}
                      onChange={(e) => setMaxDistanceKm(Number(e.target.value))}
                      min="0"
                      step="0.1"
                      className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="requireExif"
                        checked={requireExifGps}
                        onChange={(e) => setRequireExifGps(e.target.checked)}
                        className="w-4 h-4 text-orange-600 border-neutral-300 rounded focus:ring-orange-500"
                      />
                      <label htmlFor="requireExif" className="text-sm font-medium text-neutral-700">
                        Require EXIF GPS Data
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="mockBlock"
                        checked={mockLocationBlock}
                        onChange={(e) => setMockLocationBlock(e.target.checked)}
                        className="w-4 h-4 text-orange-600 border-neutral-300 rounded focus:ring-orange-500"
                      />
                      <label htmlFor="mockBlock" className="text-sm font-medium text-neutral-700">
                        Block Mock Locations
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Time Rules */}
            <div className="rounded-xl border border-neutral-200 bg-white p-6">
              <div className="flex items-center gap-3 mb-4">
                <input
                  type="checkbox"
                  id="enableTime"
                  checked={enableTimeRules}
                  onChange={(e) => setEnableTimeRules(e.target.checked)}
                  className="w-4 h-4 text-orange-600 border-neutral-300 rounded focus:ring-orange-500"
                />
                <label htmlFor="enableTime" className="text-lg font-semibold">
                  Time & Date Rules
                </label>
              </div>

              {enableTimeRules && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Max Days After Sanction
                    </label>
                    <input
                      type="number"
                      value={maxDaysAfterSanction}
                      onChange={(e) => setMaxDaysAfterSanction(Number(e.target.value))}
                      min="0"
                      className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="allowBefore"
                      checked={allowBeforeSanction}
                      onChange={(e) => setAllowBeforeSanction(e.target.checked)}
                      className="w-4 h-4 text-orange-600 border-neutral-300 rounded focus:ring-orange-500"
                    />
                    <label htmlFor="allowBefore" className="text-sm font-medium text-neutral-700">
                      Allow Before Sanction Date
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Image Quality Rules */}
            <div className="rounded-xl border border-neutral-200 bg-white p-6">
              <div className="flex items-center gap-3 mb-4">
                <input
                  type="checkbox"
                  id="enableQuality"
                  checked={enableImageQuality}
                  onChange={(e) => setEnableImageQuality(e.target.checked)}
                  className="w-4 h-4 text-orange-600 border-neutral-300 rounded focus:ring-orange-500"
                />
                <label htmlFor="enableQuality" className="text-lg font-semibold">
                  Image Quality Rules
                </label>
              </div>

              {enableImageQuality && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Max Blur Variance
                    </label>
                    <input
                      type="number"
                      value={maxBlurVariance}
                      onChange={(e) => setMaxBlurVariance(Number(e.target.value))}
                      min="0"
                      className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Min Width (pixels)
                    </label>
                    <input
                      type="number"
                      value={minWidth}
                      onChange={(e) => setMinWidth(Number(e.target.value))}
                      min="0"
                      className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Min Height (pixels)
                    </label>
                    <input
                      type="number"
                      value={minHeight}
                      onChange={(e) => setMinHeight(Number(e.target.value))}
                      min="0"
                      className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="rejectScreenshot"
                        checked={rejectScreenshots}
                        onChange={(e) => setRejectScreenshots(e.target.checked)}
                        className="w-4 h-4 text-orange-600 border-neutral-300 rounded focus:ring-orange-500"
                      />
                      <label htmlFor="rejectScreenshot" className="text-sm font-medium text-neutral-700">
                        Reject Screenshots
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="rejectPrinted"
                        checked={rejectPrintedPhotos}
                        onChange={(e) => setRejectPrintedPhotos(e.target.checked)}
                        className="w-4 h-4 text-orange-600 border-neutral-300 rounded focus:ring-orange-500"
                      />
                      <label htmlFor="rejectPrinted" className="text-sm font-medium text-neutral-700">
                        Reject Printed Photos
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Fraud Detection */}
            <div className="rounded-xl border border-neutral-200 bg-white p-6">
              <div className="flex items-center gap-3 mb-4">
                <input
                  type="checkbox"
                  id="enableFraud"
                  checked={enableFraudDetection}
                  onChange={(e) => setEnableFraudDetection(e.target.checked)}
                  className="w-4 h-4 text-orange-600 border-neutral-300 rounded focus:ring-orange-500"
                />
                <label htmlFor="enableFraud" className="text-lg font-semibold">
                  Fraud Detection Rules
                </label>
              </div>

              {enableFraudDetection && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Max Hash Distance
                    </label>
                    <input
                      type="number"
                      value={maxHashDistance}
                      onChange={(e) => setMaxHashDistance(Number(e.target.value))}
                      min="0"
                      className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="dupDetect"
                        checked={duplicateDetection}
                        onChange={(e) => setDuplicateDetection(e.target.checked)}
                        className="w-4 h-4 text-orange-600 border-neutral-300 rounded focus:ring-orange-500"
                      />
                      <label htmlFor="dupDetect" className="text-sm font-medium text-neutral-700">
                        Duplicate Detection
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="elaCheck"
                        checked={elaTamperingCheck}
                        onChange={(e) => setElaTamperingCheck(e.target.checked)}
                        className="w-4 h-4 text-orange-600 border-neutral-300 rounded focus:ring-orange-500"
                      />
                      <label htmlFor="elaCheck" className="text-sm font-medium text-neutral-700">
                        ELA Tampering Check
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="aiDetect"
                        checked={aiGeneratedDetection}
                        onChange={(e) => setAiGeneratedDetection(e.target.checked)}
                        className="w-4 h-4 text-orange-600 border-neutral-300 rounded focus:ring-orange-500"
                      />
                      <label htmlFor="aiDetect" className="text-sm font-medium text-neutral-700">
                        AI Generated Detection
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="printedDetect"
                        checked={printedPhotoDetection}
                        onChange={(e) => setPrintedPhotoDetection(e.target.checked)}
                        className="w-4 h-4 text-orange-600 border-neutral-300 rounded focus:ring-orange-500"
                      />
                      <label htmlFor="printedDetect" className="text-sm font-medium text-neutral-700">
                        Printed Photo Detection
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Document Rules */}
            <div className="rounded-xl border border-neutral-200 bg-white p-6">
              <div className="flex items-center gap-3 mb-4">
                <input
                  type="checkbox"
                  id="enableDoc"
                  checked={enableDocumentRules}
                  onChange={(e) => setEnableDocumentRules(e.target.checked)}
                  className="w-4 h-4 text-orange-600 border-neutral-300 rounded focus:ring-orange-500"
                />
                <label htmlFor="enableDoc" className="text-lg font-semibold">
                  Document Rules
                </label>
              </div>

              {enableDocumentRules && (
                <div className="space-y-2 mt-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="reqInvoice"
                      checked={requireInvoice}
                      onChange={(e) => setRequireInvoice(e.target.checked)}
                      className="w-4 h-4 text-orange-600 border-neutral-300 rounded focus:ring-orange-500"
                    />
                    <label htmlFor="reqInvoice" className="text-sm font-medium text-neutral-700">
                      Require Invoice
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="matchAmount"
                      checked={invoiceOcrMatchAmount}
                      onChange={(e) => setInvoiceOcrMatchAmount(e.target.checked)}
                      className="w-4 h-4 text-orange-600 border-neutral-300 rounded focus:ring-orange-500"
                    />
                    <label htmlFor="matchAmount" className="text-sm font-medium text-neutral-700">
                      Invoice OCR Match Amount
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="matchDate"
                      checked={invoiceOcrMatchDate}
                      onChange={(e) => setInvoiceOcrMatchDate(e.target.checked)}
                      className="w-4 h-4 text-orange-600 border-neutral-300 rounded focus:ring-orange-500"
                    />
                    <label htmlFor="matchDate" className="text-sm font-medium text-neutral-700">
                      Invoice OCR Match Date
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Asset Rules */}
            <div className="rounded-xl border border-neutral-200 bg-white p-6">
              <div className="flex items-center gap-3 mb-4">
                <input
                  type="checkbox"
                  id="enableAsset"
                  checked={enableAssetRules}
                  onChange={(e) => setEnableAssetRules(e.target.checked)}
                  className="w-4 h-4 text-orange-600 border-neutral-300 rounded focus:ring-orange-500"
                />
                <label htmlFor="enableAsset" className="text-lg font-semibold">
                  Asset Classification Rules
                </label>
              </div>

              {enableAssetRules && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Allowed Asset Types (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={assetTypes}
                      onChange={(e) => setAssetTypes(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="TRACTOR, VEHICLE, MACHINERY"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Confidence Threshold (0-1)
                    </label>
                    <input
                      type="number"
                      value={confidenceThreshold}
                      onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
                      min="0"
                      max="1"
                      step="0.01"
                      className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="classReq"
                      checked={classifierRequired}
                      onChange={(e) => setClassifierRequired(e.target.checked)}
                      className="w-4 h-4 text-orange-600 border-neutral-300 rounded focus:ring-orange-500"
                    />
                    <label htmlFor="classReq" className="text-sm font-medium text-neutral-700">
                      Classifier Required
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Risk Weights */}
            <div className="rounded-xl border border-neutral-200 bg-white p-6">
              <div className="flex items-center gap-3 mb-4">
                <input
                  type="checkbox"
                  id="enableRisk"
                  checked={enableRiskWeights}
                  onChange={(e) => setEnableRiskWeights(e.target.checked)}
                  className="w-4 h-4 text-orange-600 border-neutral-300 rounded focus:ring-orange-500"
                />
                <label htmlFor="enableRisk" className="text-lg font-semibold">
                  Risk Weights
                </label>
              </div>

              {enableRiskWeights && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  {Object.entries(riskWeights).map(([key, value]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        {key.replace(/_/g, " ")}
                      </label>
                      <input
                        type="number"
                        value={value}
                        onChange={(e) =>
                          setRiskWeights({ ...riskWeights, [key]: Number(e.target.value) })
                        }
                        min="0"
                        max="100"
                        className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Thresholds */}
            <div className="rounded-xl border border-neutral-200 bg-white p-6">
              <div className="flex items-center gap-3 mb-4">
                <input
                  type="checkbox"
                  id="enableThresh"
                  checked={enableThresholds}
                  onChange={(e) => setEnableThresholds(e.target.checked)}
                  className="w-4 h-4 text-orange-600 border-neutral-300 rounded focus:ring-orange-500"
                />
                <label htmlFor="enableThresh" className="text-lg font-semibold">
                  Decision Thresholds
                </label>
              </div>

              {enableThresholds && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Auto Approve Max Risk
                    </label>
                    <input
                      type="number"
                      value={autoApproveMaxRisk}
                      onChange={(e) => setAutoApproveMaxRisk(Number(e.target.value))}
                      min="0"
                      max="100"
                      className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Manual Review Min Risk
                    </label>
                    <input
                      type="number"
                      value={manualReviewMinRisk}
                      onChange={(e) => setManualReviewMinRisk(Number(e.target.value))}
                      min="0"
                      max="100"
                      className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      High Risk Min Risk
                    </label>
                    <input
                      type="number"
                      value={highRiskMinRisk}
                      onChange={(e) => setHighRiskMinRisk(Number(e.target.value))}
                      min="0"
                      max="100"
                      className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
              <button
                type="button"
                onClick={() => router.push("/admin/rulesets")}
                className="px-6 py-2 rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <IconDeviceFloppy className="h-4 w-4" />
                    Create RuleSet
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
