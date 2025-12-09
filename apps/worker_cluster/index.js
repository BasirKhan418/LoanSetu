// worker.js
import "dotenv/config";
import { Worker, QueueEvents } from "bullmq";
import valkey from "./queue.js";
import axios from "axios";

const PYTHON_VALIDATION_URL = process.env.PYTHON_VALIDATION_URL || "http://localhost:8000";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

// 👷 Worker to process "validationQueue"
const validationWorker = new Worker(
  "validationQueue",
  async (job) => {
    console.log("👷 Processing validation job:", job.id);

    const { submission } = job.data;
    console.log("📧 Validating submission ID:", submission._id);

    try {
      // Prepare payload for Python validation service
      // Transform the data to match Python service schema
      const payload = {
        submissionId: submission._id.toString(),
        loanId: submission.loanId._id ? submission.loanId._id.toString() : submission.loanId.toString(),
        tenantId: submission.tenantId.toString(),
        rullsetid: submission.rullsetid.toString(),
        // Map 'ruleset' to 'rullset' with proper structure
        rullset: submission.ruleset || {},
        loanDetails: {
          assetType: submission.loanDetailsId?.assetType || "UNKNOWN",
          sanctionDate: submission.loanId?.sanctionDate || null,
          sanctionAmount: submission.loanId?.sanctionAmount || 0,
          minAmount: submission.loanDetailsId?.minAmount || 0,
          maxAmount: submission.loanDetailsId?.maxAmount || 0,
        },
        gps: {
          gpsLat: submission.media?.[0]?.gpsLat || null,
          gpsLng: submission.media?.[0]?.gpsLng || null,
        },
        media: submission.media || [],
        sanctionDate: submission.loanId?.sanctionDate || null,
        expectedInvoiceAmount: submission.loanId?.sanctionAmount || 0,
      };

      console.log("📦 Payload structure:", JSON.stringify({
        submissionId: payload.submissionId,
        hasRullset: !!payload.rullset,
        hasRules: !!payload.rullset?.rules,
        mediaCount: payload.media?.length,
        gps: payload.gps
      }, null, 2));

      console.log("🚀 Sending to Python validation service...");
      console.log("📝 Payload validation:", {
        hasSubmissionId: !!payload.submissionId,
        hasRullset: !!payload.rullset,
        hasRulesInRullset: !!payload.rullset?.rules,
        mediaCount: payload.media?.length,
        assetType: payload.loanDetails?.assetType
      });
      
      // Call Python validation service
      const validationResponse = await axios.post(
        `${PYTHON_VALIDATION_URL}/validate`,
        payload,
        {
          timeout: 120000, // 2 minutes timeout
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✅ Python validation completed:", validationResponse.data);

      const aiSummary = validationResponse.data.aiSummary;

      // Update submission in backend (callback)
      console.log("🔄 Updating submission in backend...");
      const updateResponse = await axios.patch(
        `${BACKEND_URL}/api/submission/update`,
        {
          submissionId: submission._id,
          aiSummary: aiSummary,
        },
        {
          timeout: 30000,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✅ Submission updated:", updateResponse.data);

      return {
        success: true,
        submissionId: submission._id,
        decision: aiSummary.decision,
        riskScore: aiSummary.riskScore,
        completedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("❌ Validation job failed:", error.message);
      
      // Log error details
      if (error.response) {
        console.error("Response error:", error.response.status, error.response.data);
      } else if (error.request) {
        console.error("Request error: No response received");
      }

      throw error; // Re-throw to trigger retry
    }
  },
  {
    connection: valkey,
    concurrency: 5, // Process up to 5 jobs concurrently
  }
);

// Events listener
const events = new QueueEvents("validationQueue", {
  connection: valkey,
});

events.on("completed", ({ jobId }) => {
  console.log(`🎉 Validation job ${jobId} completed successfully`);
});

events.on("failed", ({ jobId, failedReason }) => {
  console.error(`❌ Validation job ${jobId} failed:`, failedReason);
});

validationWorker.on("error", (err) => {
  console.error("⚠️ Worker error:", err);
});

console.log("🚀 Validation worker started. Listening for jobs on 'validationQueue'...");
