import mongoose from "mongoose";

const BankSchema = new mongoose.Schema({
  name: { type: String, required: true },          // e.g. "State Bank of India"
  branchName: { type: String },                    // e.g. "Bhubaneswar Main Branch"
  ifsc: { type: String },                       
  // contact person (bank officer / nodal officer)
  contactName: { type: String },
  contactEmail: { type: String },
  contactPhone: { type: String },

  // location / tenant mapping
  state: { type: String },                         // state where branch operates
  district: { type: String },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant" },

  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.models?.Bank || mongoose.model("Bank", BankSchema);
