import mongoose from "mongoose";

const StateAdminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  img: { type: String },
  phone: { type: String },
  state: { type: String, required: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true },

  // role flags
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false }, // after onboarding / approval
  isSuperAdmin:{type:Boolean,default:false}
}, { timestamps: true });

export default mongoose.models?.Admin || mongoose.model("Admin", StateAdminSchema);
