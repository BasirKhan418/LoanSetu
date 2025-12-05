import mongoose from "mongoose";

const StateOfficerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  img: { type: String },
  phone: { type: String, required: true },

  designation: { type: String },            // e.g. "Assistant Director", "Field Officer"
  department: { type: String },             // e.g. "Agriculture", "MSME"

  // jurisdiction info
  state: { type: String, required: true },
  district: { type: String },               // officer assigned to a district
  block: { type: String },

  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true },

  // role toggles
  canReviewSubmissions: { type: Boolean, default: true },
  canApprove: { type: Boolean, default: true },

  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },  // after state admin approves this officer
}, { timestamps: true });

export default mongoose.models?.StateOfficer || mongoose.model("StateOfficer", StateOfficerSchema);
