import mongoose from "mongoose";

const LoanSchema = new mongoose.Schema(
  {
    // Human readable loan number for UI and mapping with bank records
    loanNumber: { type: String, required: true, unique: true },

    // Beneficiary who took this loan
    beneficiaryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // Which loanDetails template this loan is based on
    loanDetailsId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LoanDetails",
      required: true
    },

    // Optional: which bank officer created this loan record in system
    createdByBankOfficerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BankOfficer"
    },

    // Multi-tenant (you *can* derive this from LoanDetails.tenantId,
    // but having it here makes filtering faster/safer)
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true
    },

    // Per-loan financial actuals
    sanctionAmount: { type: Number, required: true }, // should be between LoanDetails.minAmount & maxAmount
    subsidyAmount: { type: Number, default: 0 }, // calculated subsidy amount
    currency: { type: String, default: "INR" },
    bankid:{type: mongoose.Schema.Types.ObjectId,ref:"Bank",required:true},
    sanctionDate: { type: Date, required: true },

    // Applicant information (cached for quick access)
    applicantName: { type: String },
    assetType: { type: String }, // cached from LoanDetails

    // Chosen mode for this particular loan (allowed set is in LoanDetails.allowedDisbursementModes)
    disbursementMode: {
      type: String,
      enum: ["FULL", "INSTALLMENTS", "VENDOR_PAYMENT"],
      default: "FULL"
    },

    // Utilization verification status (your workflow status)
    verificationStatus: {
      type: String,
      enum: ["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED"],
      default: "PENDING"
    },

    // Optional AI summary for quick dashboards
    lastAiRiskScore: { type: Number, default: null }, // 0–100
    lastAiDecision: {
      type: String,
      enum: ["AUTO_APPROVE", "AUTO_REVIEW", "AUTO_HIGH_RISK", null],
      default: null
    },

    // Manual remarks by state officer
    officerRemarks: { type: String },

    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.models?.Loans || mongoose.model("Loans", LoanSchema);
