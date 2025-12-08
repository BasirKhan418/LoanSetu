import mongoose from "mongoose";

const MediaSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["IMAGE", "VIDEO", "DOCUMENT"],
      required: true,
    },
    fileKey: { type: String, required: true }, // S3 / MinIO key or URL
    mimeType: { type: String },
    sizeInBytes: { type: Number },

    // Capture metadata
    capturedAt: { type: Date },     // from device / EXIF
    gpsLat: { type: Number },
    gpsLng: { type: Number },

    // Quick flags (can be set later by AI too)
    hasExif: { type: Boolean, default: false },
    hasGpsExif: { type: Boolean, default: false },
    isScreenshot: { type: Boolean, default: false },
    isPrintedPhotoSuspect: { type: Boolean, default: false },
  },
  { _id: false }
);

const SubmissionSchema = new mongoose.Schema(
  {
    // Relations
    loanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Loan",
      required: true,
    },

    beneficiaryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },

    // RuleSet used for this submission (from LoanDetails.rullsetid)
    rullsetid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rullset",
      required: true,
    },

    // For convenience
    loanDetailsId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LoanDetails",
    },

    // Lifecycle
    submissionType: {
      type: String,
      enum: ["INITIAL", "RESUBMISSION", "APPEAL"],
      default: "INITIAL",
    },

    status: {
      type: String,
      enum: [
        "PENDING_UPLOAD",   // device captured but not synced (optional)
        "PENDING_AI",       // waiting for AI engine
        "AI_COMPLETED",     // AI done
        "UNDER_REVIEW",     // officer opened
        "APPROVED",         // utilization approved
        "REJECTED",         // rejected
        "RESUBMISSION" // ask user to resubmit
      ],
      default: "PENDING_AI",
    },

    // Media files for this submission
    media: {
      type: [MediaSchema],
      validate: {
        validator: (v: any[]) => Array.isArray(v) && v.length > 0,
        message: "At least one media file is required",
      },
    },

    // Device + app info (optional but useful)
    deviceInfo: {
      platform: { type: String },      // "android" | "ios"
      osVersion: { type: String },
      appVersion: { type: String },
      deviceModel: { type: String },
    },

    captureContext: {
      isOffline: { type: Boolean, default: false },
      networkType: { type: String },   // "4G", "WiFi", etc.
      submittedAt: { type: Date },     // when user pressed submit
      syncedAt: { type: Date },        // when server received
    },

    // AI summary (high-level result)
    aiSummary: {
      riskScore: { type: Number }, // 0–100
      decision: {
        type: String,
        enum: ["AUTO_APPROVE", "HUMAN_REVIEW", "AUTO_HIGH_RISK","REJECTED"],
        default: null,
      },
      flags: [{ type: String }],   // e.g. ["GPS_MISMATCH", "DUPLICATE_IMAGE"]
      features: {
        type: mongoose.Schema.Types.Mixed, // snapshot of features if needed
      },
      validatedAt: { type: Date },
    },

    // Officer review info
    review: {
      reviewedByOfficerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "StateOfficer",
      },
      reviewDecision: {
        type: String,
        enum: ["APPROVED", "REJECTED", "ASK_RESUBMISSION", null],
        default: null,
      },
      reviewRemarks: { type: String },
      reviewedAt: { type: Date },
    },

    // Appeal flow
    appeal: {
      isAppealed: { type: Boolean, default: false },
      appealReason: { type: String },
      appealStatus: {
        type: String,
        enum: ["PENDING", "ACCEPTED", "REJECTED", null],
        default: null,
      },
      appealHandledById: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "StateAdmin",
      },
      appealHandledAt: { type: Date },
    },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models?.Submission ||
  mongoose.model("Submission", SubmissionSchema);
