import mongoose from "mongoose";

const ConflictOfInterestSchema = new mongoose.Schema({
  submissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Submission",
    required: true,
    index: true,
  },
  officerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "StateOfficer",
    required: true,
    index: true,
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tenant",
    required: true,
    index: true,
  },
  aiSummary: { type: Object },          // full AI summary
  officerRemarks: { type: String },
  conflictDetected: { type: Boolean, default: false, index: true },
  sentimentScore: { type: Number, default: 0 },
  aiReason: { type: String },
  conflictType: { 
    type: String, 
    enum: ["AI_APPROVE_OFFICER_REJECT", "AI_REJECT_OFFICER_APPROVE", "AI_NEEDRESUBMIT_OFFICER_APPROVE", "SENTIMENT_BASED", null],
    default: null,
    index: true,
  },
  aiDecision: { type: String },
  officerDecision: { type: String },
  isResolved: { type: Boolean, default: false, index: true },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  resolvedAt: { type: Date },
  resolutionNotes: { type: String },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true // Automatically manage createdAt and updatedAt
});

export default mongoose.models.ConflictOfInterest ||
  mongoose.model("ConflictOfInterest", ConflictOfInterestSchema);
