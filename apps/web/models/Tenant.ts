import mongoose from "mongoose";
const TenantSchema = new mongoose.Schema({
  name: { type: String, required: true },       // Odisha
  code: { type: String, required: true },       // OD
  logoUrl: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });
const Tenant = mongoose.model("Tenant", TenantSchema);
export default Tenant;