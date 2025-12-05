import mongoose from "mongoose";
const TenantSchema = new mongoose.Schema({
  name: { type: String, required: true },       // Odisha
  code: { type: String, required: true },       // OD
  logoUrl: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });
export default mongoose.models?.Tenant || mongoose.model("Tenant", TenantSchema);