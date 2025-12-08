// worker.js
import "dotenv/config";
import { Worker, QueueEvents } from "bullmq";
import valkey from "./queue.js";

// 👷 Worker to process "validationQueue"
const validationWorker = new Worker(
  "validationQueue",
  async (job) => {
    console.log("👷 Processing job:", job);

    const { submission } = job.data;
    console.log("📧 Validating submission ID:", submission);

    // your actual logic...

    return { delivered: true, at: new Date().toISOString() };
  },
  {
    connection: valkey,
  }
);

// Events listener
const events = new QueueEvents("validationQueue", {
  connection: valkey,
});

events.on("completed", ({ jobId }) => {
  console.log(`🎉 Job ${jobId} completed`);
});

events.on("failed", ({ jobId, failedReason }) => {
  console.error(`❌ Job ${jobId} failed:`, failedReason);
});

validationWorker.on("error", (err) => {
  console.error("Worker error:", err);
});

console.log("🚀 Worker started. Listening for jobs on 'validationQueue'...");
