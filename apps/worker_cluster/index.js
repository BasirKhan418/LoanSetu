// worker.js
import "dotenv/config";
import { Worker, QueueEvents } from "bullmq";
import valkey from "./queue.js";
import axios from "axios";
import OpenAI from "openai";

const PYTHON_VALIDATION_URL = process.env.PYTHON_VALIDATION_URL || "http://localhost:8000";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// 🔑 Init OpenAI client
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// 👷 Worker to process "validationQueue"
const validationWorker = new Worker(
  "validationQueue",
  async (job) => {
    console.log("👷 Processing validation job:", job.id);

    const { submission } = job.data;
    console.log("📧 Validating submission ID:", submission._id);

    try {
      // Prepare payload for Python validation service
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

      console.log(
        "📦 Payload structure:",
        JSON.stringify(
          {
            submissionId: payload.submissionId,
            hasRullset: !!payload.rullset,
            hasRules: !!payload.rullset?.rules,
            mediaCount: payload.media?.length,
            gps: payload.gps,
          },
          null,
          2
        )
      );

      console.log("🚀 Sending to Python validation service...");
      console.log("📝 Payload validation:", {
        hasSubmissionId: !!payload.submissionId,
        hasRullset: !!payload.rullset,
        hasRulesInRullset: !!payload.rullset?.rules,
        mediaCount: payload.media?.length,
        assetType: payload.loanDetails?.assetType,
      });

      // 1️⃣ Call Python validation service
      const validationResponse = await axios.post(
        `${PYTHON_VALIDATION_URL}/validate`,
        payload,
        {
          timeout: 120000, // 2 minutes
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✅ Python validation completed:", validationResponse.data);

      const aiSummary = validationResponse.data.aiSummary;

      // 2️⃣ Call LLM to generate underwriting report (LoanSetu style)
      /** @type {string | null} */
      let llmReportString = null;

      if (!OPENAI_API_KEY) {
        console.warn("⚠️ OPENAI_API_KEY not set. Skipping LLM report generation.");
      } else {
        try {
          console.log("🧠 Generating LLM underwriting report...");

          // Keep input compact to avoid token bloat
          const llmInput = {
            meta: {
              submissionId: payload.submissionId,
              loanId: payload.loanId,
              tenantId: payload.tenantId,
              product: "LoanSetu",
            },
            // Whatever your Python service returns
            aiSummary,
            // Minimal structured context for the model
            context: {
              loanDetails: payload.loanDetails,
              sanctionDate: payload.sanctionDate,
              expectedInvoiceAmount: payload.expectedInvoiceAmount,
              gps: payload.gps,
              mediaCount: payload.media?.length || 0,
            },
          };

          const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            temperature: 0.2,
            response_format: { type: "json_object" }, // force JSON
            messages: [
              {
                role: "system",
                content:
                  "You are an AI underwriting analyst for a loan verification product called LoanSetu. " +
                  "You receive automated validation results and must generate a structured JSON report for a bank admin. " +
                  "Respond ONLY with a single valid JSON object. No markdown, no extra text.",
              },
              {
                role: "user",
                content:
                  "Based on the following data, create a loan underwriting report JSON. " +
                  "The goal is to help a bank admin decide whether to APPROVE, REJECT, or send for MANUAL_REVIEW. " +
                  "Fields required (keys):\n" +
                  "status: 'APPROVE' | 'REJECT' | 'MANUAL_REVIEW'\n" +
                  "summary: short 2-3 line summary of what the data tells about this submission.\n" +
                  "reasons: array of strings with clear reasons supporting the status.\n" +
                  "riskFactors: array of strings focusing on risk and fraud-related observations.\n" +
                  "supportingSignals: array of strings focusing on positive/compliance signals.\n" +
                  "recommendationForBankAdmin: 1 short paragraph telling the bank admin what to do next.\n" +
                  "requiredAdditionalDocuments: array of strings (e.g. 'Latest bank statement', 'GST return copy') if manual review or reject.\n" +
                  "faqs: array of { question: string, answer: string } for typical doubts a bank admin might have about this case.\n" +
                  "loanSetuNotes: { engine: 'LoanSetu-AI-v1', generatedAt: ISO datetime string, internalTags: string[] }.\n\n" +
                  "Here is the raw data (aiSummary + context):\n" +
                  JSON.stringify(llmInput),
              },
            ],
          });

          llmReportString = completion.choices[0]?.message?.content?.trim() || null;

          console.log("🧾 LLM report generated:", llmReportString);
        } catch (llmError) {
          console.error("❌ LLM report generation failed:", llmError);
        }
      }

      // 3️⃣ Update submission in backend (callback)
      console.log("🔄 Updating submission in backend...");
      const updatePayload = {
        submissionId: submission._id,
        aiSummary: aiSummary,
      };

      // Attach LLM report string so backend can push into report[] array
      if (llmReportString) {
        updatePayload.llmReport = llmReportString; // backend: push this into reports[]
      }

      const updateResponse = await axios.patch(
        `${BACKEND_URL}/api/submission/update`,
        updatePayload,
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
        decision: aiSummary?.decision,
        riskScore: aiSummary?.riskScore,
        hasLlmReport: !!llmReportString,
        completedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("❌ Validation job failed:", error.message);

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
