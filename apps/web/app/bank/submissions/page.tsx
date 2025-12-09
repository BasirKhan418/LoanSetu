"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BankSidebar } from "../../../components/bank/BankSidebar";
import {
  IconFilter,
  IconSearch,
  IconEye,
  IconCheck,
  IconX,
  IconRefresh,
  IconEdit,
  IconCopy,
} from "@tabler/icons-react";

interface Media {
  type: string;
  fileKey: string;
  mimeType?: string;
  sizeInBytes?: number;
  capturedAt?: string;
  gpsLat?: number;
  gpsLng?: number;
  hasExif?: boolean;
  hasGpsExif?: boolean;
  isScreenshot?: boolean;
  isPrintedPhotoSuspect?: boolean;
}

interface DeviceInfo {
  platform?: string;
  osVersion?: string;
  appVersion?: string;
  deviceModel?: string;
}

interface CaptureContext {
  isOffline?: boolean;
  networkType?: string;
  submittedAt?: string;
  syncedAt?: string;
}

interface Submission {
  _id: string;
  loanId: string | {
    _id: string;
    loanNumber: string;
    applicantName?: string;
  };
  beneficiaryId: string | {
    _id: string;
    name: string;
    email?: string;
  };
  tenantId: string;
  rullsetid: string;
  loanDetailsId?: string;
  submissionType: string;
  status: string;
  media: Media[];
  deviceInfo?: DeviceInfo;
  captureContext?: CaptureContext;
  aiSummary?: {
    riskScore?: number;
    decision?: string;
    flags?: string[];
    features?: any;
    validatedAt?: string;
  };
  review?: {
    reviewDecision?: string | null;
    reviewRemarks?: string;
    reviewedAt?: string;
    reviewedByOfficerId?: string;
  };
  appeal?: {
    isAppealed: boolean;
    appealReason?: string;
    appealStatus?: string | null;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function BankSubmissions() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bankData, setBankData] = useState<any>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewDecision, setReviewDecision] = useState("");
  const [reviewRemarks, setReviewRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedLoanId, setCopiedLoanId] = useState<string | null>(null);

  useEffect(() => {
    validateSession();
  }, []);

  useEffect(() => {
    filterSubmissions();
  }, [searchTerm, statusFilter, submissions]);

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
      fetchSubmissions();
    } catch (error) {
      console.error("Session validation failed:", error);
      router.push("/bank/signin");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const response = await fetch("/api/editsubmission", {
        method: "GET",
        credentials: "include",
      });
      const data = await response.json();
      if (data.success) {
        setSubmissions(data.data);
        setFilteredSubmissions(data.data);
      } else {
        console.error("Failed to fetch submissions:", data.message);
      }
    } catch (error) {
      console.error("Error fetching submissions:", error);
    }
  };

  const getLoanNumber = (loanId: any): string => {
    if (typeof loanId === "string") return loanId;
    return loanId?.loanNumber || "N/A";
  };

  const getBeneficiaryName = (beneficiaryId: any): string => {
    if (typeof beneficiaryId === "string") return beneficiaryId;
    return beneficiaryId?.name || "N/A";
  };

  const getBeneficiaryEmail = (beneficiaryId: any): string => {
    if (typeof beneficiaryId === "string") return "";
    return beneficiaryId?.email || "";
  };

  const copyLoanId = async (loanId: any) => {
    const id = typeof loanId === "string" ? loanId : loanId?._id;
    if (id) {
      try {
        await navigator.clipboard.writeText(id);
        setCopiedLoanId(id);
        setTimeout(() => setCopiedLoanId(null), 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }
  };

  const filterSubmissions = () => {
    let filtered = submissions;

    if (statusFilter !== "ALL") {
      filtered = filtered.filter((sub) => sub.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (sub) => {
          const loanNum = getLoanNumber(sub.loanId).toLowerCase();
          const benefName = getBeneficiaryName(sub.beneficiaryId).toLowerCase();
          const benefEmail = getBeneficiaryEmail(sub.beneficiaryId).toLowerCase();
          const search = searchTerm.toLowerCase();
          
          return loanNum.includes(search) || benefName.includes(search) || benefEmail.includes(search) || sub._id.includes(search);
        }
      );
    }

    setFilteredSubmissions(filtered);
  };

  const handleReviewSubmission = async () => {
    if (!selectedSubmission || !reviewDecision) {
      alert("Please select a decision");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/editsubmission", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          submissionId: selectedSubmission._id,
          reviewDecision,
          reviewRemarks,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert("Submission reviewed successfully");
        setShowReviewModal(false);
        setSelectedSubmission(null);
        setReviewDecision("");
        setReviewRemarks("");
        fetchSubmissions();
      } else {
        alert(`Failed to review submission: ${data.message}`);
      }
    } catch (error) {
      console.error("Error reviewing submission:", error);
      alert("An error occurred while reviewing the submission");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusColors: { [key: string]: string } = {
      PENDING_AI: "bg-yellow-500",
      AI_COMPLETED: "bg-blue-500",
      UNDER_REVIEW: "bg-orange-500",
      APPROVED: "bg-green-500",
      REJECTED: "bg-red-500",
      NEED_RESUBMISSION: "bg-purple-500",
    };
    return statusColors[status] || "bg-gray-500";
  };

  const getRiskScoreColor = (score?: number) => {
    if (!score) return "text-gray-500";
    if (score < 30) return "text-green-500";
    if (score < 70) return "text-orange-500";
    return "text-red-500";
  };

  if (loading) {
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
      <BankSidebar open={open} setOpen={setOpen} bankData={bankData} />
      <div className="flex flex-1 flex-col overflow-auto">
        <div className="flex w-full flex-col gap-4 rounded-tl-2xl border border-neutral-200 bg-white p-4 md:p-8">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                Submission Management
              </h1>
              <p className="text-sm text-neutral-600 mt-1">
                Review and manage loan application submissions
              </p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search by loan number, name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING_AI">Pending AI</option>
                <option value="AI_COMPLETED">AI Completed</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="NEED_RESUBMISSION">Need Resubmission</option>
              </select>
              <button
                onClick={fetchSubmissions}
                className="p-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors"
              >
                <IconRefresh className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-sm text-neutral-600">Total Submissions</p>
              <p className="text-2xl font-bold text-neutral-900">{submissions.length}</p>
            </div>
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
              <p className="text-sm text-orange-700">Pending Review</p>
              <p className="text-2xl font-bold text-orange-600">
                {submissions.filter((s) => s.status === "AI_COMPLETED" || s.status === "UNDER_REVIEW").length}
              </p>
            </div>
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <p className="text-sm text-green-700">Approved</p>
              <p className="text-2xl font-bold text-green-600">
                {submissions.filter((s) => s.status === "APPROVED").length}
              </p>
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-700">Rejected</p>
              <p className="text-2xl font-bold text-red-600">
                {submissions.filter((s) => s.status === "REJECTED").length}
              </p>
            </div>
          </div>

          {/* Submissions Table */}
          <div className="overflow-x-auto rounded-lg border border-neutral-200">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Loan Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Beneficiary
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    AI Risk Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    AI Decision
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {filteredSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-neutral-500">
                      {searchTerm || statusFilter !== "ALL" 
                        ? "No submissions found matching your criteria." 
                        : "No submissions available."}
                    </td>
                  </tr>
                ) : (
                  filteredSubmissions.map((submission) => (
                    <tr key={submission._id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-neutral-900">
                          {getLoanNumber(submission.loanId)}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <code className="text-xs bg-neutral-100 px-2 py-0.5 rounded font-mono text-neutral-600">
                            {typeof submission.loanId === "string" ? submission.loanId : submission.loanId._id}
                          </code>
                          <button
                            onClick={() => copyLoanId(submission.loanId)}
                            className="p-1 hover:bg-neutral-100 rounded transition-colors"
                            title="Copy Loan ID"
                          >
                            {copiedLoanId === (typeof submission.loanId === "string" ? submission.loanId : submission.loanId._id) ? (
                              <IconCheck className="h-3 w-3 text-green-600" />
                            ) : (
                              <IconCopy className="h-3 w-3 text-neutral-400" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-neutral-900">
                          {getBeneficiaryName(submission.beneficiaryId)}
                        </div>
                        <div className="text-xs text-neutral-500">
                          {getBeneficiaryEmail(submission.beneficiaryId) || `ID: ${typeof submission.beneficiaryId === "string" ? submission.beneficiaryId.substring(0, 8) + "..." : submission.beneficiaryId._id.substring(0, 8) + "..."}`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-md bg-blue-100 text-blue-700">
                          {submission.submissionType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-md ${
                            submission.status === "APPROVED"
                              ? "bg-green-100 text-green-700"
                              : submission.status === "REJECTED"
                              ? "bg-red-100 text-red-700"
                              : submission.status === "UNDER_REVIEW"
                              ? "bg-orange-100 text-orange-700"
                              : submission.status === "AI_COMPLETED"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {submission.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`text-sm font-semibold ${
                            !submission.aiSummary?.riskScore
                              ? "text-neutral-500"
                              : submission.aiSummary.riskScore < 30
                              ? "text-green-600"
                              : submission.aiSummary.riskScore < 70
                              ? "text-orange-600"
                              : "text-red-600"
                          }`}
                        >
                          {submission.aiSummary?.riskScore ?? "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                        {submission.aiSummary?.decision?.replace(/_/g, " ") || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                        {new Date(submission.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => router.push(`/bank/submissions/${submission._id}`)}
                            className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                            title="View AI Analysis Details"
                          >
                            <IconEye className="h-4 w-4" />
                            View
                          </button>
                          <button
                            onClick={() => {
                              setSelectedSubmission(submission);
                              setShowReviewModal(true);
                            }}
                            className="text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
                          >
                            <IconEdit className="h-4 w-4" />
                            Review
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-xl p-6">
            <div className="mb-6 flex items-center justify-between border-b border-neutral-200 pb-4">
              <h2 className="text-2xl font-bold text-neutral-900">Review Submission</h2>
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setSelectedSubmission(null);
                  setReviewDecision("");
                  setReviewRemarks("");
                }}
                className="text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                <IconX className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Submission Details */}
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                <h3 className="mb-3 text-lg font-semibold text-neutral-900">Submission Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-neutral-500">Submission ID</p>
                    <p className="text-neutral-900 font-mono text-xs">{selectedSubmission._id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500">Loan ID</p>
                    <p className="text-neutral-900 font-medium">{getLoanNumber(selectedSubmission.loanId)}</p>
                    <p className="text-neutral-500 font-mono text-xs">{typeof selectedSubmission.loanId === "string" ? selectedSubmission.loanId : selectedSubmission.loanId._id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500">Beneficiary</p>
                    <p className="text-neutral-900 font-medium">{getBeneficiaryName(selectedSubmission.beneficiaryId)}</p>
                    <p className="text-neutral-500 text-xs">{getBeneficiaryEmail(selectedSubmission.beneficiaryId)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500">Type</p>
                    <p className="text-neutral-900 font-medium">{selectedSubmission.submissionType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500">Status</p>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-md ${
                        selectedSubmission.status === "APPROVED"
                          ? "bg-green-100 text-green-700"
                          : selectedSubmission.status === "REJECTED"
                          ? "bg-red-100 text-red-700"
                          : selectedSubmission.status === "UNDER_REVIEW" || selectedSubmission.status === "HUMAN_REVIEW"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {selectedSubmission.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500">Media Files</p>
                    <p className="text-neutral-900 font-medium">{selectedSubmission.media.length} file(s)</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500">Submitted</p>
                    <p className="text-neutral-900 font-medium">
                      {new Date(selectedSubmission.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500">Last Updated</p>
                    <p className="text-neutral-900 font-medium">
                      {new Date(selectedSubmission.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Device & Capture Information */}
              {(selectedSubmission.deviceInfo || selectedSubmission.captureContext) && (
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                  <h3 className="mb-3 text-lg font-semibold text-neutral-900">Device & Capture Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedSubmission.deviceInfo && (
                      <>
                        <div>
                          <p className="text-sm text-neutral-500">Device Model</p>
                          <p className="text-neutral-900 font-medium">{selectedSubmission.deviceInfo.deviceModel || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-neutral-500">Platform</p>
                          <p className="text-neutral-900 font-medium">{selectedSubmission.deviceInfo.platform || "N/A"} {selectedSubmission.deviceInfo.osVersion}</p>
                        </div>
                        <div>
                          <p className="text-sm text-neutral-500">App Version</p>
                          <p className="text-neutral-900 font-medium">{selectedSubmission.deviceInfo.appVersion || "N/A"}</p>
                        </div>
                      </>
                    )}
                    {selectedSubmission.captureContext && (
                      <>
                        <div>
                          <p className="text-sm text-neutral-500">Network Type</p>
                          <p className="text-neutral-900 font-medium">{selectedSubmission.captureContext.networkType || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-neutral-500">Capture Mode</p>
                          <p className="text-neutral-900 font-medium">{selectedSubmission.captureContext.isOffline ? "Offline" : "Online"}</p>
                        </div>
                        {selectedSubmission.captureContext.submittedAt && (
                          <div>
                            <p className="text-sm text-neutral-500">Submitted At</p>
                            <p className="text-neutral-900 font-medium">{new Date(selectedSubmission.captureContext.submittedAt).toLocaleString()}</p>
                          </div>
                        )}
                        {selectedSubmission.captureContext.syncedAt && (
                          <div>
                            <p className="text-sm text-neutral-500">Synced At</p>
                            <p className="text-neutral-900 font-medium">{new Date(selectedSubmission.captureContext.syncedAt).toLocaleString()}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Media Details */}
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                <h3 className="mb-3 text-lg font-semibold text-neutral-900">Media Files ({selectedSubmission.media.length})</h3>
                <div className="space-y-3">
                  {selectedSubmission.media.map((media, idx) => (
                    <div key={idx} className="rounded-lg border border-neutral-300 bg-white p-3">
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <p className="text-neutral-500">Type</p>
                          <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 text-xs font-medium">{media.type}</span>
                        </div>
                        <div>
                          <p className="text-neutral-500">Size</p>
                          <p className="text-neutral-900 font-medium">{media.sizeInBytes ? (media.sizeInBytes / 1024).toFixed(0) + " KB" : "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-neutral-500">MIME Type</p>
                          <p className="text-neutral-900 font-medium text-xs">{media.mimeType || "N/A"}</p>
                        </div>
                        {media.capturedAt && (
                          <div className="col-span-2">
                            <p className="text-neutral-500">Captured At</p>
                            <p className="text-neutral-900 font-medium text-xs">{new Date(media.capturedAt).toLocaleString()}</p>
                          </div>
                        )}
                        {(media.gpsLat && media.gpsLng) && (
                          <div>
                            <p className="text-neutral-500">GPS</p>
                            <p className="text-neutral-900 font-medium text-xs">{media.gpsLat?.toFixed(6)}, {media.gpsLng?.toFixed(6)}</p>
                          </div>
                        )}
                        <div className="col-span-3 flex gap-2 flex-wrap">
                          {media.hasExif && <span className="px-2 py-0.5 rounded-md bg-green-100 text-green-700 text-xs">Has EXIF</span>}
                          {media.hasGpsExif && <span className="px-2 py-0.5 rounded-md bg-green-100 text-green-700 text-xs">GPS EXIF</span>}
                          {media.isScreenshot && <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-700 text-xs">Screenshot</span>}
                          {media.isPrintedPhotoSuspect && <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-700 text-xs">Printed Photo</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Summary */}
              {selectedSubmission.aiSummary && (
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                  <h3 className="mb-3 text-lg font-semibold text-neutral-900">AI Analysis</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-neutral-500">Risk Score</p>
                      <p
                        className={`text-2xl font-bold ${
                          !selectedSubmission.aiSummary.riskScore
                            ? "text-neutral-500"
                            : selectedSubmission.aiSummary.riskScore < 30
                            ? "text-green-600"
                            : selectedSubmission.aiSummary.riskScore < 70
                            ? "text-orange-600"
                            : "text-red-600"
                        }`}
                      >
                        {selectedSubmission.aiSummary.riskScore ?? "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-500">AI Decision</p>
                      <p className="text-neutral-900 font-medium">
                        {selectedSubmission.aiSummary.decision?.replace(/_/g, " ") || "Pending"}
                      </p>
                    </div>
                    {selectedSubmission.aiSummary.validatedAt && (
                      <div className="col-span-2">
                        <p className="text-sm text-neutral-500">Validated At</p>
                        <p className="text-neutral-900 font-medium">
                          {new Date(selectedSubmission.aiSummary.validatedAt).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                  {selectedSubmission.aiSummary.flags &&
                    selectedSubmission.aiSummary.flags.length > 0 && (
                      <div className="mt-4">
                        <p className="mb-2 text-sm text-neutral-500">Flags</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedSubmission.aiSummary.flags.map((flag, idx) => (
                            <span
                              key={idx}
                              className="rounded-md bg-red-100 text-red-700 px-3 py-1 text-xs font-medium"
                            >
                              {flag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  {selectedSubmission.aiSummary.features && Object.keys(selectedSubmission.aiSummary.features).length > 0 && (
                    <div className="mt-4">
                      <p className="mb-2 text-sm text-neutral-500">AI Features</p>
                      <div className="rounded-lg bg-white p-3 border border-neutral-300">
                        <pre className="text-xs text-neutral-900 whitespace-pre-wrap">
                          {JSON.stringify(selectedSubmission.aiSummary.features, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Previous Review */}
              {selectedSubmission.review?.reviewDecision && (
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                  <h3 className="mb-3 text-lg font-semibold text-neutral-900">Previous Review</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-neutral-500">Decision</p>
                      <p className="text-neutral-900 font-medium">{selectedSubmission.review.reviewDecision}</p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-500">Remarks</p>
                      <p className="text-neutral-900">{selectedSubmission.review.reviewRemarks || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-500">Reviewed At</p>
                      <p className="text-neutral-900">
                        {selectedSubmission.review.reviewedAt
                          ? new Date(selectedSubmission.review.reviewedAt).toLocaleString()
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Review Form */}
              <div className="rounded-lg border border-neutral-200 bg-white p-4">
                <h3 className="mb-4 text-lg font-semibold text-neutral-900">Update Review Decision</h3>
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-neutral-700">
                      Decision *
                    </label>
                    <select
                      value={reviewDecision}
                      onChange={(e) => setReviewDecision(e.target.value)}
                      className="w-full rounded-lg border border-neutral-300 px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none"
                      required
                    >
                      <option value="">Select Decision</option>
                      <option value="APPROVED">Approve</option>
                      <option value="REJECTED">Reject</option>
                      <option value="ASK_RESUBMISSION">Ask for Resubmission</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-neutral-700">
                      Remarks
                    </label>
                    <textarea
                      value={reviewRemarks}
                      onChange={(e) => setReviewRemarks(e.target.value)}
                      rows={4}
                      className="w-full rounded-lg border border-neutral-300 px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none"
                      placeholder="Add your remarks here..."
                    />
                  </div>

                  <div className="flex gap-4 pt-2">
                    <button
                      onClick={handleReviewSubmission}
                      disabled={isSubmitting || !reviewDecision}
                      className="flex-1 rounded-lg bg-orange-600 px-4 py-2.5 font-semibold text-white hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSubmitting ? "Submitting..." : "Submit Review"}
                    </button>
                    <button
                      onClick={() => {
                        setShowReviewModal(false);
                        setSelectedSubmission(null);
                        setReviewDecision("");
                        setReviewRemarks("");
                      }}
                      className="rounded-lg border border-neutral-300 px-4 py-2.5 text-neutral-700 hover:bg-neutral-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
