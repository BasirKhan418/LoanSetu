import mongoose from "mongoose";

const ConflictOfInterestSchema = new mongoose.Schema({
  submissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Submission",
    required: true,
  },
  officerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "StateOfficer",
    required: true,
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tenant",
    required: true,
  },
  aiSummary: { type: Object },          // full AI summary
  officerRemarks: { type: String },
  conflictDetected: { type: Boolean, default: false },
  sentimentScore: { type: Number, default: 0 },
  aiReason: { type: String },

  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.ConflictOfInterest ||
  mongoose.model("ConflictOfInterest", ConflictOfInterestSchema);
