"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { cn } from "../../../../lib/utils";
import { StateOfficerSidebar } from "../../../../components/stateofficer/StateOfficerSidebar";
import {
  IconArrowLeft,
  IconAlertTriangle,
  IconCircleCheck,
  IconFileDescription,
  IconMapPin,
  IconCamera,
  IconDeviceMobile,
  IconClock,
  IconFileText,
  IconDownload,
  IconSparkles,
  IconShieldCheck,
  IconAlertCircle,
  IconChecks,
  IconX,
  IconPhoto,
  IconVideo,
  IconPlayerPlay,
  IconChartBar,
  IconTarget,
  IconBrandPython,
} from "@tabler/icons-react";

// Typewriter Effect Component
const TypewriterText = ({ text, speed = 30 }: { text: string; speed?: number }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, speed]);

  return <span>{displayedText}</span>;
};

// Risk Score Gauge Component
const RiskScoreGauge = ({ score }: { score: number }) => {
  const getColor = (score: number) => {
    if (score < 30) return "text-green-600";
    if (score < 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getLabel = (score: number) => {
    if (score < 30) return "Low Risk";
    if (score < 60) return "Medium Risk";
    return "High Risk";
  };

  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-48 h-48 mx-auto">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="96"
          cy="96"
          r="90"
          stroke="currentColor"
          strokeWidth="12"
          fill="transparent"
          className="text-neutral-200"
        />
        <circle
          cx="96"
          cy="96"
          r="90"
          stroke="currentColor"
          strokeWidth="12"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={`${getColor(score)} transition-all duration-1000 ease-out`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-5xl font-bold ${getColor(score)}`}>{score}</span>
        <span className="text-sm text-neutral-500 mt-1">{getLabel(score)}</span>
      </div>
    </div>
  );
};

// Flag Badge Component
const FlagBadge = ({ flag }: { flag: string }) => {
  const getFlagDetails = (flag: string) => {
    const flagMap: Record<string, { label: string; color: string; icon: any }> = {
      UNKNOWN_ASSET: { label: "Unknown Asset", color: "bg-red-100 text-red-800 border-red-200", icon: IconAlertCircle },
      INVOICE_AMOUNT_MISMATCH: { label: "Invoice Mismatch", color: "bg-orange-100 text-orange-800 border-orange-200", icon: IconAlertTriangle },
      EXIF_MISSING: { label: "EXIF Missing", color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: IconCamera },
      LOW_MEDIA_COUNT: { label: "Low Media Count", color: "bg-blue-100 text-blue-800 border-blue-200", icon: IconFileDescription },
      INVOICE_DATE_MISSING: { label: "Date Missing", color: "bg-purple-100 text-purple-800 border-purple-200", icon: IconClock },
      GPS_MISMATCH: { label: "GPS Mismatch", color: "bg-pink-100 text-pink-800 border-pink-200", icon: IconMapPin },
      SCREENSHOT_DETECTED: { label: "Screenshot Detected", color: "bg-red-100 text-red-800 border-red-200", icon: IconAlertTriangle },
      DUPLICATE_MEDIA: { label: "Duplicate Media", color: "bg-orange-100 text-orange-800 border-orange-200", icon: IconAlertCircle },
    };

    return flagMap[flag] || { label: flag, color: "bg-neutral-100 text-neutral-800 border-neutral-200", icon: IconAlertCircle };
  };

  const { label, color, icon: Icon } = getFlagDetails(flag);

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${color}`}>
      <Icon className="w-4 h-4" />
      {label}
    </span>
  );
};

export default function StateOfficerSubmissionDetails() {
  const params = useParams();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stateOfficerData, setStateOfficerData] = useState<any>(null);
  const [submission, setSubmission] = useState<any>(null);
  const [showAIExplanation, setShowAIExplanation] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    validateSession();
  }, []);

  useEffect(() => {
    if (stateOfficerData && params.id) {
      fetchSubmission();
    }
  }, [params.id, stateOfficerData]);

  const validateSession = async () => {
    try {
      const response = await fetch("/api/verify");
      const data = await response.json();

      if (data.success) {
        setStateOfficerData(data.data);
      } else {
        alert("Session expired. Please login again.");
        router.push("/stateofficer/signin");
      }
    } catch (error) {
      console.error("Error validating session:", error);
      alert("Failed to validate session");
      router.push("/stateofficer/signin");
    }
  };

  const fetchSubmission = async () => {
    try {
      const response = await fetch(`/api/stateofficer-submission/${params.id}`);
      const data = await response.json();

      if (data.success) {
        setSubmission(data.submission);
      } else {
        alert("Failed to fetch submission details");
      }
    } catch (error) {
      console.error("Error fetching submission:", error);
      alert("An error occurred while fetching submission details");
    } finally {
      setLoading(false);
    }
  };

  const parseLLMReport = (reportString: string) => {
    try {
      return JSON.parse(reportString);
    } catch {
      return null;
    }
  };

  const generatePDFReport = () => {
    // Import the report generator utility
    import("../../../../utils/reportGenerator").then(({ printReport, downloadHTMLReport }) => {
      const choice = confirm("Click OK to print the report, or Cancel to download as HTML file");
      if (choice) {
        printReport(submission);
      } else {
        downloadHTMLReport(submission);
      }
    });
  };

  if (loading || !stateOfficerData) {
    return (
      <div
        className={cn(
          "mx-auto flex w-full flex-1 flex-col overflow-hidden bg-white md:flex-row",
          "h-screen"
        )}
      >
        <StateOfficerSidebar open={open} setOpen={setOpen} />
        <div className="flex flex-1 flex-col overflow-auto">
          <div className="flex w-full flex-col gap-4 rounded-tl-2xl border border-neutral-200 bg-white p-4 md:p-8">
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-neutral-600">Loading submission details...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div
        className={cn(
          "mx-auto flex w-full flex-1 flex-col overflow-hidden bg-white md:flex-row",
          "h-screen"
        )}
      >
        <StateOfficerSidebar open={open} setOpen={setOpen} />
        <div className="flex flex-1 flex-col overflow-auto">
          <div className="flex w-full flex-col gap-4 rounded-tl-2xl border border-neutral-200 bg-white p-4 md:p-8">
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <IconAlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <p className="text-neutral-600">Submission not found</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const llmReport = parseLLMReport(submission.llmReport || "{}");
  const riskScore = submission.aiSummary?.riskScore || 0;
  const decision = submission.aiSummary?.decision || "PENDING";
  const flags = submission.aiSummary?.flags || [];
  const features = submission.aiSummary?.features || {};

  return (
    <div
      className={cn(
        "mx-auto flex w-full flex-1 flex-col overflow-hidden bg-white md:flex-row",
        "h-screen"
      )}
    >
      <StateOfficerSidebar open={open} setOpen={setOpen} />
      <div className="flex flex-1 flex-col overflow-auto">
        <div className="flex w-full flex-col gap-4 rounded-tl-2xl border border-neutral-200 bg-white p-4 md:p-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              <IconArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Submissions</span>
            </button>
            <button
              onClick={generatePDFReport}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <IconDownload className="w-5 h-5" />
              Download Report
            </button>
          </div>

          {/* Hero Section with AI Decision */}
          <div className="relative bg-gradient-to-r from-green-600 via-teal-500 to-green-600 rounded-2xl p-8 text-white shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-green-600/50 to-transparent animate-pulse"></div>
            <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <IconSparkles className="w-8 h-8" />
                  <h1 className="text-3xl font-bold">AI Validation Report</h1>
                </div>
                <p className="text-green-100 text-lg mb-2">
                  Submission ID: {submission._id}
                </p>
                <p className="text-green-100">
                  Loan Number: {submission.loanId?.loanNumber || "N/A"}
                </p>
                <p className="text-green-100">
                  Applicant: {submission.loanId?.applicantName || submission.beneficiaryId?.name || "N/A"}
                </p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <div className="text-center mb-3">
                  <span className="text-sm text-green-100">AI Decision</span>
                </div>
                <div className={`px-6 py-3 rounded-lg font-bold text-lg ${
                  decision === "APPROVED" ? "bg-green-500" :
                  decision === "REJECTED" ? "bg-red-500" :
                  decision === "NEED_RESUBMISSION" ? "bg-orange-500" :
                  "bg-yellow-500"
                }`}>
                  {decision.replace(/_/g, " ")}
                </div>
              </div>
            </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-2">
            <div className="flex gap-2">
              {["overview", "media", "ai-analysis", "technical"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                    activeTab === tab
                      ? "bg-green-600 text-white shadow-md"
                      : "text-neutral-600 hover:bg-neutral-100"
                  }`}
                >
                  {tab.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
                </button>
              ))}
            </div>
          </div>

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Risk Score */}
              <div className="lg:col-span-1 bg-gradient-to-br from-white to-green-50/30 rounded-xl shadow-lg border-2 border-green-100 p-6">
                <h3 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <IconShieldCheck className="w-6 h-6 text-green-600" />
                  </div>
                  Risk Assessment
                </h3>
                <RiskScoreGauge score={riskScore} />
                <div className="mt-6 space-y-3">
                  <div className="flex justify-between items-center p-3 bg-neutral-50 rounded-lg">
                    <span className="text-sm text-neutral-600">Confidence</span>
                    <span className="font-semibold text-neutral-900">
                      {features.classifier_confidence ? `${(features.classifier_confidence * 100).toFixed(2)}%` : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-neutral-50 rounded-lg">
                    <span className="text-sm text-neutral-600">Asset Type</span>
                    <span className="font-semibold text-neutral-900">
                      {features.classifier_predicted || "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Flags and Issues */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-lg border border-neutral-200 p-6">
                <h3 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
                  <IconAlertTriangle className="w-6 h-6 text-orange-600" />
                  Detected Issues ({flags.length})
                </h3>
                {flags.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {flags.map((flag: string, index: number) => (
                      <FlagBadge key={index} flag={flag} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-neutral-500">
                    <IconCircleCheck className="w-12 h-12 mx-auto mb-2 text-green-500" />
                    <p>No issues detected</p>
                  </div>
                )}

                {/* LLM Summary */}
                {llmReport && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">AI Summary</h4>
                    <p className="text-sm text-green-800">{llmReport.summary}</p>
                  </div>
                )}
              </div>

              {/* Loan Details */}
              <div className="lg:col-span-3 bg-white rounded-xl shadow-lg border border-neutral-200 p-6">
                <h3 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
                  <IconFileText className="w-6 h-6 text-green-600" />
                  Loan Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-neutral-500">Loan Number</label>
                      <p className="font-semibold text-neutral-900 mt-1">
                        {submission.loanId?.loanNumber || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-neutral-500">Applicant Name</label>
                      <p className="font-semibold text-neutral-900 mt-1">
                        {submission.loanId?.applicantName || submission.beneficiaryId?.name || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-neutral-500">Sanctioned Amount</label>
                      <p className="font-semibold text-neutral-900 mt-1">
                        ₹{submission.loanId?.sanctionedAmount?.toLocaleString() || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-neutral-500">Sanction Date</label>
                      <p className="font-semibold text-neutral-900 mt-1">
                        {submission.loanId?.sanctionDate ? new Date(submission.loanId.sanctionDate).toLocaleDateString() : "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-neutral-500">Invoice Amount (OCR)</label>
                      <p className="font-semibold text-neutral-900 mt-1">
                        ₹{features.invoice_amount_ocr?.toLocaleString() || "Not detected"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-neutral-500">Submission Type</label>
                      <p className="font-semibold text-neutral-900 mt-1">
                        {submission.submissionType || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Media Tab */}
          {activeTab === "media" && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-lg border border-neutral-200 p-6">
                <h3 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
                  <IconCamera className="w-6 h-6 text-purple-600" />
                  Media Files ({submission.media?.length || 0})
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {submission.media?.map((media: any, index: number) => (
                    <div
                      key={index}
                      className="group relative aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-neutral-50 to-neutral-100 border-2 border-neutral-200 hover:border-green-400 hover:shadow-2xl transition-all duration-300 cursor-pointer"
                      onClick={() => setSelectedMedia(media)}
                    >
                      {media.type === "IMAGE" || media.type === "DOCUMENT" ? (
                        <>
                          <img
                            src={media.fileKey}
                            alt={`Media ${index + 1}`}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute top-2 left-2 bg-blue-500/90 backdrop-blur-sm text-white p-2 rounded-lg">
                            <IconPhoto className="w-4 h-4" />
                          </div>
                        </>
                      ) : media.type === "VIDEO" ? (
                        <>
                          <video
                            src={media.fileKey}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                            <div className="bg-green-600/90 backdrop-blur-sm p-4 rounded-full group-hover:scale-110 transition-transform">
                              <IconPlayerPlay className="w-8 h-8 text-white" />
                            </div>
                          </div>
                          <div className="absolute top-2 left-2 bg-red-500/90 backdrop-blur-sm text-white p-2 rounded-lg">
                            <IconVideo className="w-4 h-4" />
                          </div>
                        </>
                      ) : null}
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white text-xs font-bold uppercase tracking-wider">
                              {media.type}
                            </span>
                            {media.type === "VIDEO" && (
                              <span className="text-white/80 text-xs">Click to play</span>
                            )}
                          </div>
                          <p className="text-white/90 text-xs">
                            {(media.sizeInBytes / 1024 / 1024).toFixed(2)} MB
                          </p>
                          {media.capturedAt && (
                            <p className="text-white/70 text-xs mt-1">
                              {new Date(media.capturedAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* EXIF Badge */}
                      {media.hasExif && (
                        <div className="absolute top-2 right-2 bg-green-500/90 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
                          <IconCircleCheck className="w-3 h-3" />
                          EXIF
                        </div>
                      )}
                      {media.isScreenshot && (
                        <div className="absolute top-2 right-2 bg-red-500/90 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
                          <IconAlertCircle className="w-3 h-3" />
                          Screenshot
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* EXIF Details */}
                {features.exif_details && features.exif_details.length > 0 && (
                  <div className="mt-8">
                    <h4 className="font-semibold text-neutral-900 mb-4">EXIF Metadata</h4>
                    <div className="space-y-3">
                      {features.exif_details.map((exif: any, index: number) => (
                        <div key={index} className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-neutral-500">Camera:</span>
                              <p className="font-medium text-neutral-900">{exif.camera_make} {exif.camera_model}</p>
                            </div>
                            <div>
                              <span className="text-neutral-500">Captured:</span>
                              <p className="font-medium text-neutral-900">{exif.datetime_original}</p>
                            </div>
                            <div>
                              <span className="text-neutral-500">EXIF Tags:</span>
                              <p className="font-medium text-neutral-900">{exif.exif_tags_count} tags</p>
                            </div>
                            <div>
                              <span className="text-neutral-500">GPS:</span>
                              <p className="font-medium text-neutral-900">
                                {exif.gps_latitude ? "✓ Available" : "✗ Missing"}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Location Information */}
              {(features.asset_location || features.home_location) && (
                <div className="bg-white rounded-xl shadow-lg border border-neutral-200 p-6">
                  <h3 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
                    <IconMapPin className="w-6 h-6 text-red-600" />
                    Location Verification
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <label className="text-sm text-blue-700 font-medium">Asset Location</label>
                      <p className="text-neutral-900 mt-1">
                        {features.asset_location?.lat?.toFixed(6)}, {features.asset_location?.lng?.toFixed(6)}
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <label className="text-sm text-green-700 font-medium">Home Location</label>
                      <p className="text-neutral-900 mt-1">
                        {features.home_location?.lat?.toFixed(6)}, {features.home_location?.lng?.toFixed(6)}
                      </p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <label className="text-sm text-purple-700 font-medium">Distance</label>
                      <p className="text-neutral-900 mt-1 text-2xl font-bold">
                        {features.gps_home_vs_asset_km} km
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AI Analysis Tab */}
          {activeTab === "ai-analysis" && (
            <div className="space-y-6">
              {/* AI Explainability with Typewriter */}
              <div className="bg-gradient-to-br from-green-600 to-teal-600 rounded-xl shadow-2xl p-8 text-white">
                <div className="flex items-center gap-3 mb-6">
                  <IconSparkles className="w-8 h-8" />
                  <h3 className="text-2xl font-bold">AI Explainability Report</h3>
                </div>
                
                {!showAIExplanation ? (
                  <button
                    onClick={() => setShowAIExplanation(true)}
                    className="px-6 py-3 bg-white text-green-600 rounded-lg font-semibold hover:bg-green-50 transition-colors"
                  >
                    Generate AI Explanation
                  </button>
                ) : (
                  <div className="space-y-6 text-green-50">
                    {llmReport && (
                      <>
                        <div>
                          <h4 className="font-semibold text-lg mb-2">Executive Summary</h4>
                          <p className="text-base leading-relaxed">
                            <TypewriterText text={llmReport.summary || "No summary available"} speed={20} />
                          </p>
                        </div>

                        {llmReport.reasons && llmReport.reasons.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-lg mb-3">Key Findings</h4>
                            <ul className="space-y-2">
                              {llmReport.reasons.map((reason: string, index: number) => (
                                <li key={index} className="flex items-start gap-2">
                                  <IconChecks className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                  <span><TypewriterText text={reason} speed={15} /></span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {llmReport.riskFactors && llmReport.riskFactors.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-lg mb-3">Risk Factors</h4>
                            <ul className="space-y-2">
                              {llmReport.riskFactors.map((risk: string, index: number) => (
                                <li key={index} className="flex items-start gap-2">
                                  <IconAlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                  <span><TypewriterText text={risk} speed={15} /></span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {llmReport.supportingSignals && llmReport.supportingSignals.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-lg mb-3">Supporting Evidence</h4>
                            <ul className="space-y-2">
                              {llmReport.supportingSignals.map((signal: string, index: number) => (
                                <li key={index} className="flex items-start gap-2">
                                  <IconCircleCheck className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                  <span><TypewriterText text={signal} speed={15} /></span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {llmReport.recommendationForBankAdmin && (
                          <div className="mt-6 p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                            <h4 className="font-semibold text-lg mb-2">Recommendation</h4>
                            <p className="leading-relaxed">
                              <TypewriterText text={llmReport.recommendationForBankAdmin} speed={15} />
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Required Documents */}
              {llmReport?.requiredAdditionalDocuments && llmReport.requiredAdditionalDocuments.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg border border-neutral-200 p-6">
                  <h3 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
                    <IconFileDescription className="w-6 h-6 text-orange-600" />
                    Required Additional Documents
                  </h3>
                  <ul className="space-y-2">
                    {llmReport.requiredAdditionalDocuments.map((doc: string, index: number) => (
                      <li key={index} className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
                        <IconFileText className="w-5 h-5 text-orange-600" />
                        <span className="text-neutral-900">{doc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* FAQs */}
              {llmReport?.faqs && llmReport.faqs.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg border border-neutral-200 p-6">
                  <h3 className="text-lg font-bold text-neutral-900 mb-4">Frequently Asked Questions</h3>
                  <div className="space-y-4">
                    {llmReport.faqs.map((faq: any, index: number) => (
                      <div key={index} className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                        <h4 className="font-semibold text-neutral-900 mb-2">{faq.question}</h4>
                        <p className="text-neutral-700">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Technical Tab */}
          {activeTab === "technical" && (
            <div className="space-y-6">
              {/* Device Information */}
              <div className="bg-white rounded-xl shadow-lg border border-neutral-200 p-6">
                <h3 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
                  <IconDeviceMobile className="w-6 h-6 text-green-600" />
                  Device Information
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-neutral-50 rounded-lg">
                    <label className="text-sm text-neutral-500">Platform</label>
                    <p className="font-semibold text-neutral-900 mt-1">
                      {submission.deviceInfo?.platform || "N/A"}
                    </p>
                  </div>
                  <div className="p-4 bg-neutral-50 rounded-lg">
                    <label className="text-sm text-neutral-500">OS Version</label>
                    <p className="font-semibold text-neutral-900 mt-1">
                      {submission.deviceInfo?.osVersion || "N/A"}
                    </p>
                  </div>
                  <div className="p-4 bg-neutral-50 rounded-lg">
                    <label className="text-sm text-neutral-500">App Version</label>
                    <p className="font-semibold text-neutral-900 mt-1">
                      {submission.deviceInfo?.appVersion || "N/A"}
                    </p>
                  </div>
                  <div className="p-4 bg-neutral-50 rounded-lg">
                    <label className="text-sm text-neutral-500">Device Model</label>
                    <p className="font-semibold text-neutral-900 mt-1">
                      {submission.deviceInfo?.deviceModel || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Capture Context */}
              <div className="bg-white rounded-xl shadow-lg border border-neutral-200 p-6">
                <h3 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
                  <IconClock className="w-6 h-6 text-green-600" />
                  Capture Context
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-neutral-50 rounded-lg">
                    <label className="text-sm text-neutral-500">Offline Mode</label>
                    <p className="font-semibold text-neutral-900 mt-1">
                      {submission.captureContext?.isOffline ? "Yes" : "No"}
                    </p>
                  </div>
                  <div className="p-4 bg-neutral-50 rounded-lg">
                    <label className="text-sm text-neutral-500">Network Type</label>
                    <p className="font-semibold text-neutral-900 mt-1">
                      {submission.captureContext?.networkType || "N/A"}
                    </p>
                  </div>
                  <div className="p-4 bg-neutral-50 rounded-lg">
                    <label className="text-sm text-neutral-500">Submitted At</label>
                    <p className="font-semibold text-neutral-900 mt-1">
                      {submission.captureContext?.submittedAt
                        ? new Date(submission.captureContext.submittedAt).toLocaleString()
                        : "N/A"}
                    </p>
                  </div>
                  <div className="p-4 bg-neutral-50 rounded-lg">
                    <label className="text-sm text-neutral-500">Synced At</label>
                    <p className="font-semibold text-neutral-900 mt-1">
                      {submission.captureContext?.syncedAt
                        ? new Date(submission.captureContext.syncedAt).toLocaleString()
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Image Analysis */}
              <div className="bg-white rounded-xl shadow-lg border border-neutral-200 p-6">
                <h3 className="text-lg font-bold text-neutral-900 mb-6">Image Analysis Metrics</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <label className="text-sm text-blue-700 font-medium">Blur Score</label>
                    <p className="text-2xl font-bold text-neutral-900 mt-1">
                      {features.avg_blur_variance?.toFixed(2) || "N/A"}
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <label className="text-sm text-green-700 font-medium">ELA Score</label>
                    <p className="text-2xl font-bold text-neutral-900 mt-1">
                      {features.ela_avg_score?.toFixed(2) || "N/A"}
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <label className="text-sm text-purple-700 font-medium">Days After Sanction</label>
                    <p className="text-2xl font-bold text-neutral-900 mt-1">
                      {features.days_after_sanction || "N/A"}
                    </p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <label className="text-sm text-orange-700 font-medium">Screenshot Count</label>
                    <p className="text-2xl font-bold text-neutral-900 mt-1">
                      {features.screenshot_count || 0}
                    </p>
                  </div>
                  <div className="p-4 bg-pink-50 rounded-lg border border-pink-200">
                    <label className="text-sm text-pink-700 font-medium">Printed Suspects</label>
                    <p className="text-2xl font-bold text-neutral-900 mt-1">
                      {features.printed_suspect_count || 0}
                    </p>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <label className="text-sm text-yellow-700 font-medium">Duplicate Matches</label>
                    <p className="text-2xl font-bold text-neutral-900 mt-1">
                      {features.duplicate_matches?.length || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Rekognition Labels */}
              {features.rekognition_labels && features.rekognition_labels.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg border border-neutral-200 p-6">
                  <h3 className="text-lg font-bold text-neutral-900 mb-4">AWS Rekognition Labels</h3>
                  <div className="flex flex-wrap gap-2">
                    {features.rekognition_labels.map((label: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Invoice OCR */}
              {features.invoice_present && (
                <div className="bg-white rounded-xl shadow-lg border border-neutral-200 p-6">
                  <h3 className="text-lg font-bold text-neutral-900 mb-4">Invoice OCR Analysis</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-neutral-50 rounded-lg">
                        <label className="text-sm text-neutral-500">Invoice Amount</label>
                        <p className="text-2xl font-bold text-neutral-900 mt-1">
                          ₹{features.invoice_amount_ocr?.toLocaleString() || "Not detected"}
                        </p>
                      </div>
                      <div className="p-4 bg-neutral-50 rounded-lg">
                        <label className="text-sm text-neutral-500">Invoice Date</label>
                        <p className="text-2xl font-bold text-neutral-900 mt-1">
                          {features.invoice_date_ocr || "Not detected"}
                        </p>
                      </div>
                    </div>
                    {features.invoice_ocr_text && (
                      <div className="p-4 bg-neutral-50 rounded-lg">
                        <label className="text-sm text-neutral-500 block mb-2">Raw OCR Text</label>
                        <pre className="text-xs text-neutral-700 whitespace-pre-wrap font-mono">
                          {features.invoice_ocr_text}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Media Modal */}
      {selectedMedia && (
        <div
          className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedMedia(null)}
        >
          <button
            onClick={() => setSelectedMedia(null)}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm p-3 rounded-full text-white transition-all z-10"
          >
            <IconX className="w-6 h-6" />
          </button>
          
          <div className="max-w-7xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
            {selectedMedia.type === "VIDEO" ? (
              <div className="relative">
                <video
                  src={selectedMedia.fileKey}
                  controls
                  autoPlay
                  className="w-full h-auto max-h-[85vh] rounded-lg shadow-2xl"
                />
                <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-lg p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">Video File</p>
                      <p className="text-sm text-white/80">Size: {(selectedMedia.sizeInBytes / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    {selectedMedia.capturedAt && (
                      <p className="text-sm text-white/80">
                        Captured: {new Date(selectedMedia.capturedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={selectedMedia.fileKey}
                  alt="Preview"
                  className="w-full h-auto max-h-[85vh] object-contain rounded-lg shadow-2xl"
                />
                <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-lg p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{selectedMedia.type}</p>
                      <p className="text-sm text-white/80">Size: {(selectedMedia.sizeInBytes / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    {selectedMedia.capturedAt && (
                      <p className="text-sm text-white/80">
                        Captured: {new Date(selectedMedia.capturedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                  {selectedMedia.gpsLat && selectedMedia.gpsLng && (
                    <div className="mt-2 pt-2 border-t border-white/20">
                      <p className="text-sm text-white/80">
                        <IconMapPin className="w-4 h-4 inline mr-1" />
                        GPS: {selectedMedia.gpsLat.toFixed(6)}, {selectedMedia.gpsLng.toFixed(6)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
