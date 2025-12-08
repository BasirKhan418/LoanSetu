"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  IconUpload, 
  IconFileSpreadsheet,
  IconDownload,
  IconAlertCircle,
  IconCheck,
  IconEye,
  IconEdit,
  IconSearch,
  IconRefresh,
  IconX
} from "@tabler/icons-react";
import { BankSidebar } from "../../../components/bank/BankSidebar";
import * as XLSX from "xlsx";

interface BankData {
  name: string;
  branchName?: string;
  ifsc?: string;
}

interface Loan {
  _id: string;
  loanNumber: string;
  beneficiaryId: {
    name: string;
    phone: string;
    state?: string;
  };
  loanDetailsId: {
    name: string;
    schemeName?: string;
  };
  sanctionAmount: number;
  verificationStatus: string;
  disbursementMode: string;
  createdAt: string;
}

interface ProcessedData {
  users: Array<{
    name: string;
    phone: string;
    email?: string;
    img?: string;
    addressLine1?: string;
    addressLine2?: string;
    village?: string;
    block?: string;
    district?: string;
    state?: string;
    pincode?: string;
  }>;
  loans: Array<{
    loanNumber: string;
    beneficiaryId?: string;
    loanDetailsId: string;
    createdByBankOfficerId?: string;
    tenantId?: string;
    sanctionAmount: number;
    currency?: string;
    bankid?: string;
    sanctionDate: string;
    disbursementMode: string;
  }>;
}

export default function BulkUploadPage() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [bankData, setBankData] = useState<BankData | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [filteredLoans, setFilteredLoans] = useState<Loan[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [fileName, setFileName] = useState("");
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);

  useEffect(() => {
    validateBankSession();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredLoans(loans);
    } else {
      const filtered = loans.filter(
        (loan) =>
          loan.loanNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          loan.beneficiaryId?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          loan.verificationStatus.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredLoans(filtered);
    }
  }, [searchTerm, loans]);

  const validateBankSession = async () => {
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

      setBankData({
        name: data.data.name || "Bank",
        branchName: data.data.branchName,
        ifsc: data.data.ifsc,
      });
      
      fetchLoans();
    } catch (err) {
      console.error("Session validation error:", err);
      router.push("/bank/signin");
    }
  };

  const fetchLoans = async () => {
    try {
      const response = await fetch("/api/loans", {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (data.success) {
        setLoans(data.data || []);
        setFilteredLoans(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching loans:", err);
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    // Create sample template data
    const templateData = [
      {
        // User fields (Required)
        "User Name": "Rahul Kumar",
        "Phone": "9337203632",
        // User fields (Optional)
        "Email": "",
        "Address Line 1": "Plot 23, Main Road",
        "Address Line 2": "Near Bus Stand",
        "Village": "XYZ Village",
        "Block": "Bhubaneswar Block",
        "District": "Khurda",
        "State": "ODISHA",
        "Pincode": "751001",
        // Loan fields (Required)
        "Loan Number": "LN-2025-000123",
        "Loan Details ID": "679f245b9df7a12345678902",
        "Sanction Amount": 250000,
        // Loan fields (Optional)
        "Currency": "INR",
        "Sanction Date": "2025-02-10",
        "Disbursement Mode": "FULL"
      },
      {
        // User fields (Required)
        "User Name": "Priya Das",
        "Phone": "9876543210",
        // User fields (Optional)
        "Email": "priya@example.com",
        "Address Line 1": "House 12",
        "Address Line 2": "Market Road",
        "Village": "ABC Village",
        "Block": "Cuttack Sadar",
        "District": "Cuttack",
        "State": "ODISHA",
        "Pincode": "753001",
        // Loan fields (Required)
        "Loan Number": "LN-2025-000124",
        "Loan Details ID": "679f245b9df7a98765432102",
        "Sanction Amount": 180000,
        // Loan fields (Optional)
        "Currency": "INR",
        "Sanction Date": "2025-02-12",
        "Disbursement Mode": "INSTALLMENTS"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Loan Template");
    XLSX.writeFile(wb, "loan_upload_template.xlsx");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError("");
    setSuccess("");
    setProcessedData(null);
    setUploadResult(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheetName = workbook.SheetNames?.[0];
      if (!firstSheetName) {
        setError("The uploaded file does not contain any sheets");
        return;
      }
      const worksheet = workbook.Sheets[firstSheetName];
      if (!worksheet) {
        setError("The first sheet is missing or unreadable");
        return;
      }
      const jsonData = XLSX.utils.sheet_to_json(worksheet as XLSX.WorkSheet);

      if (!jsonData || jsonData.length === 0) {
        setError("The uploaded file is empty or invalid");
        return;
      }

      // Transform Excel data to API format
      const users: any[] = [];
      const loans: any[] = [];

      jsonData.forEach((row: any) => {
        // User data - only include fields that have values
        const user: any = {
          name: row["User Name"] || row["name"] || "",
          phone: String(row["Phone"] || row["phone"] || ""),
        };
        
        // Add optional fields only if they exist and are not empty
        if (row["Email"] || row["email"]) user.email = row["Email"] || row["email"];
        if (row["Address Line 1"] || row["addressLine1"]) user.addressLine1 = row["Address Line 1"] || row["addressLine1"];
        if (row["Address Line 2"] || row["addressLine2"]) user.addressLine2 = row["Address Line 2"] || row["addressLine2"];
        if (row["Village"] || row["village"]) user.village = row["Village"] || row["village"];
        if (row["Block"] || row["block"]) user.block = row["Block"] || row["block"];
        if (row["District"] || row["district"]) user.district = row["District"] || row["district"];
        if (row["State"] || row["state"]) user.state = row["State"] || row["state"];
        if (row["Pincode"] || row["pincode"]) user.pincode = String(row["Pincode"] || row["pincode"]);
        
        users.push(user);

        // Loan data - only include fields that have values
        const loan: any = {
          loanNumber: row["Loan Number"] || row["loanNumber"] || "",
          loanDetailsId: row["Loan Details ID"] || row["loanDetailsId"] || "",
          sanctionAmount: Number(row["Sanction Amount"] || row["sanctionAmount"] || 0),
        };
        
        // Add optional fields only if they exist and are not empty
        if (row["Currency"] || row["currency"]) loan.currency = row["Currency"] || row["currency"];
        if (row["Sanction Date"] || row["sanctionDate"]) loan.sanctionDate = row["Sanction Date"] || row["sanctionDate"];
        if (row["Disbursement Mode"] || row["disbursementMode"]) loan.disbursementMode = row["Disbursement Mode"] || row["disbursementMode"];
        
        loans.push(loan);
      });

      const processed: ProcessedData = { users, loans };
      setProcessedData(processed);
      setSuccess(`Successfully parsed ${jsonData.length} records from the file`);
    } catch (err: any) {
      console.error(err);
      setError(`Failed to process file: ${err.message}`);
    }
  };

  const handleSubmit = async () => {
    if (!processedData) {
      setError("Please upload a file first");
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");
    setUploadResult(null);

    try {
      const response = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(processedData),
      });

      const result = await response.json();

      if (result.success || result.summary) {
        setUploadResult(result);
        setSuccess(result.message || "Loans uploaded successfully");
        setProcessedData(null);
        setFileName("");
        
        // Refresh loans list
        fetchLoans();
        
        // Close modal after 3 seconds if successful
        if (result.summary?.failureCount === 0) {
          setTimeout(() => {
            setShowUploadModal(false);
            setUploadResult(null);
          }, 3000);
        }
      } else {
        setError(result.message || "Failed to upload loans");
      }
    } catch (err: any) {
      console.error(err);
      setError(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "UNDER_REVIEW":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-orange-100 text-orange-800";
    }
  };

  if (!bankData) {
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
                Loan Management
              </h1>
              <p className="text-sm text-neutral-600 mt-1">
                View and manage bulk uploaded loans
              </p>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors"
            >
              <IconUpload className="h-4 w-4" />
              Bulk Upload
            </button>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative flex-1 w-full sm:max-w-md">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search by loan number, beneficiary, status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <button
              onClick={fetchLoans}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors"
            >
              <IconRefresh className="h-4 w-4" />
              Refresh
            </button>
          </div>

          {/* Loans Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-neutral-600 text-sm">Loading loans...</p>
              </div>
            </div>
          ) : filteredLoans.length === 0 ? (
            <div className="text-center py-12 bg-neutral-50 rounded-lg border border-neutral-200">
              <IconFileSpreadsheet className="h-12 w-12 text-neutral-400 mx-auto mb-3" />
              <p className="text-neutral-600 font-medium">No loans found</p>
              <p className="text-neutral-500 text-sm mt-1">
                Click "Bulk Upload" to add loans
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-neutral-200">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase">
                      Loan Number
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase">
                      Beneficiary
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase">
                      Scheme
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase">
                      Created
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {filteredLoans.map((loan) => (
                    <tr key={loan._id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-4 py-4 text-sm font-medium text-neutral-900">
                        {loan.loanNumber}
                      </td>
                      <td className="px-4 py-4 text-sm text-neutral-600">
                        <div>
                          <p className="font-medium text-neutral-900">
                            {loan.beneficiaryId?.name || "N/A"}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {loan.beneficiaryId?.phone || ""}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-neutral-600">
                        <div>
                          <p className="font-medium text-neutral-900">
                            {loan.loanDetailsId?.name || "N/A"}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {loan.loanDetailsId?.schemeName || ""}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-neutral-900">
                        {formatCurrency(loan.sanctionAmount)}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                            loan.verificationStatus
                          )}`}
                        >
                          {loan.verificationStatus}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-neutral-600">
                        {formatDate(loan.createdAt)}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => router.push(`/bank/loans/${loan._id}`)}
                            className="p-1.5 rounded hover:bg-neutral-100 transition-colors"
                            title="View"
                          >
                            <IconEye className="h-4 w-4 text-blue-600" />
                          </button>
                          <button
                            onClick={() => router.push(`/bank/loans/edit/${loan._id}`)}
                            className="p-1.5 rounded hover:bg-neutral-100 transition-colors"
                            title="Edit"
                          >
                            <IconEdit className="h-4 w-4 text-orange-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-neutral-900">Bulk Upload Loans</h2>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setProcessedData(null);
                  setFileName("");
                  setError("");
                  setSuccess("");
                  setUploadResult(null);
                }}
                className="p-1.5 hover:bg-red-50 rounded-lg transition-colors group"
                title="Close"
              >
                <IconX className="h-5 w-5 text-neutral-600 group-hover:text-red-600" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Instructions */}
              <div className="bg-orange-50 rounded-lg border border-orange-200 p-4">
                <h3 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                  <IconAlertCircle className="h-5 w-5" />
                  Quick Instructions
                </h3>
                <ol className="space-y-1 text-sm text-orange-800 ml-7">
                  <li>1. Download the template</li>
                  <li>2. Fill in user and loan details</li>
                  <li>3. Upload the completed file</li>
                </ol>
              </div>

              {/* Template Download */}
              <button
                onClick={downloadTemplate}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <IconDownload className="h-5 w-5" />
                Download Excel Template
              </button>

              {/* Upload Form */}
              <div className="space-y-4">
                <h3 className="font-semibold text-neutral-900">Upload File</h3>

                {/* File Input */}
                <div className="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center hover:border-orange-400 transition-colors">
                  <input
                    type="file"
                    id="file-upload"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center gap-3"
                  >
                    <div className="p-4 rounded-full bg-orange-100">
                      <IconFileSpreadsheet className="h-8 w-8 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-neutral-900 font-medium">
                        {fileName || "Click to upload file"}
                      </p>
                      <p className="text-sm text-neutral-500 mt-1">
                        Excel (.xlsx, .xls) or CSV files
                      </p>
                    </div>
                  </label>
                </div>

                {/* Preview Data */}
                {processedData && (
                  <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                    <h3 className="font-medium text-neutral-900 mb-2">
                      Preview Parsed Data
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p className="text-neutral-700">
                        <span className="font-medium">Total Records:</span> {processedData.users.length}
                      </p>
                      <p className="text-neutral-700">
                        <span className="font-medium">Users:</span> {processedData.users.length}
                      </p>
                      <p className="text-neutral-700">
                        <span className="font-medium">Loans:</span> {processedData.loans.length}
                      </p>
                    </div>
                    
                    {/* Show JSON preview */}
                    <details className="mt-4">
                      <summary className="cursor-pointer text-sm font-medium text-orange-600 hover:text-orange-700">
                        View JSON Preview
                      </summary>
                      <pre className="mt-2 p-3 bg-neutral-900 text-green-400 rounded text-xs overflow-auto max-h-64">
                        {JSON.stringify(processedData, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}

                {/* Alerts */}
                {error && (
                  <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <IconAlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                {success && !uploadResult && (
                  <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <IconCheck className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-green-800">{success}</p>
                  </div>
                )}

                {/* Upload Result */}
                {uploadResult && (
                  <div className="bg-white rounded-lg border border-neutral-200 p-4">
                    <h3 className="font-semibold text-neutral-900 mb-3">
                      Upload Results
                    </h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                        <p className="text-xs text-green-700 font-medium">Successful</p>
                        <p className="text-2xl font-bold text-green-900">
                          {uploadResult.summary?.successCount || 0}
                        </p>
                      </div>
                      <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                        <p className="text-xs text-red-700 font-medium">Failed</p>
                        <p className="text-2xl font-bold text-red-900">
                          {uploadResult.summary?.failureCount || 0}
                        </p>
                      </div>
                    </div>

                    {uploadResult.summary?.errors && uploadResult.summary.errors.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-neutral-900 mb-2">
                          Errors Details:
                        </h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {uploadResult.summary.errors.map((err: any, idx: number) => (
                            <div key={idx} className="text-xs bg-red-50 p-2 rounded border border-red-200">
                              <span className="font-medium">Row {err.index + 1}:</span> {err.reason}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={!processedData || uploading}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <IconUpload className="h-5 w-5" />
                      Upload Loans
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
