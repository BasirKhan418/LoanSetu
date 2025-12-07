import mongoose from "mongoose";

const RuleSetSchema = new mongoose.Schema({
  name: { type: String, required: true },  
  description: { type: String },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true }, // State
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  createdByRole: { 
    type: String, 
    enum: ["SUPER_ADMIN", "STATE_ADMIN"], 
    default: "STATE_ADMIN" 
  },
  rules: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  version: { type: Number, default: 1 },
  isActive: { type: Boolean, default: true },
  isApplicableToAll:{type:Boolean,default:false}
}, { timestamps: true });

export default mongoose.models?.RuleSet || mongoose.model("RuleSet", RuleSetSchema);
