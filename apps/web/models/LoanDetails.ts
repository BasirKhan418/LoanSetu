import mongoose from "mongoose";

const LoanDetailsSchema = new mongoose.Schema(
  {
    
    name: { type: String, required: true }, 
    description: { type: String },

    schemeName: { type: String, required: false },   // e.g. "PMEGP"
    schemeCode: { type: String },                   // e.g. "PMEGP"
    schemeCategory: { type: String },               

    
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true
    },
    bankid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bank",
      required: true
    },


    assetType: { type: String, required: true },     // e.g. "TRACTOR", "PUMP"
    purpose: { type: String },                       // e.g. "Farm mechanization"

    // Financial template for this loan type
    minAmount: { type: Number, required: true },
    maxAmount: { type: Number, required: true },
    subsidyPercentage: { type: Number },             // e.g. 35
    marginMoneyPercentage: { type: Number },         // e.g. 5

    // Allowed disbursement modes for this loanDetails
    allowedDisbursementModes: {
      type: [String],
      enum: ["FULL", "INSTALLMENTS", "VENDOR_PAYMENT"],
      default: ["FULL"]
    },

    // Default RuleSet for AI verification for this loan type
    rullsetid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RuleSet",
      required: true
    },

    // Flags
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.models?.LoanDetails || mongoose.model("LoanDetails", LoanDetailsSchema);
