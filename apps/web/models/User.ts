import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },  // OTP login
  email: { type: String },                                // optional
  img: { type: String },                                  // profile picture (optional)
  addressLine1: { type: String },
  addressLine2: { type: String },
  village: { type: String },
  block: { type: String },
  district: { type: String },
  state: { type: String },                                // e.g. "ODISHA"
  pincode: { type: String },

  // GPS home location for distance comparison
  homeLat: { type: Number },
  homeLng: { type: Number },

  // multi-tenant support
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant" }, // state tenant

  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false }, 
}, { timestamps: true });

export default mongoose.models?.User || mongoose.model("User", UserSchema);
