import ConflictOfInterest from "../models/ConflictOfInterest";
import OpenAI from "openai";
import { sendConflictAlertEmail } from "./email-service";

export async function analyzeConflictOfInterest({
  submission,
  officerId,
  tenantId,
  officerRemarks,
}: {
  submission: any;
  officerId: string;
  tenantId: string;
  officerRemarks: string;
}) {
  try {
    // If no OpenAI key, exit silently
    if (!process.env.OPENAI_API_KEY) {
      console.log("No OpenAI API key found — skipping LLM");
      return null;
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `
You are an audit AI. Analyze conflict of interest and sentiment.

CONTEXT:
Submission Data: ${JSON.stringify(submission)}
Officer Remarks: ${officerRemarks}

TASK:
1. Determine if conflict of interest exists.
2. Detect sentiment (1 = very negative, 5 = neutral, 10 = positive).
3. Give a short reasoning.

Return JSON:
{
  "conflict": true/false,
  "sentiment": number,
  "reason": "text"
}
`;

    const llmResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });
    //@ts-ignore
    const content = llmResponse.choices[0].message.content;
    if (!content) {
      console.error("No content received from OpenAI");
      return null;
    }

    const parsed = JSON.parse(content);

    // Validate parsed response
    if (typeof parsed.conflict !== 'boolean' || typeof parsed.sentiment !== 'number') {
      console.error("Invalid response format from OpenAI:", parsed);
      return null;
    }

    // Check if a decision-based conflict already exists
    const existingConflict = await ConflictOfInterest.findOne({
      submissionId: submission._id,
      officerId,
      conflictDetected: true,
      conflictType: { $ne: "SENTIMENT_BASED" } // Don't overwrite decision-based conflicts
    });

    if (existingConflict) {
      console.log("Decision-based conflict already exists, skipping sentiment analysis record");
      return existingConflict;
    }

    // Store result in DB only if it's a sentiment-based conflict
    let doc = null;
    if (parsed.conflict) {
      doc = await ConflictOfInterest.create({
        submissionId: submission._id,
        officerId,
        tenantId,
        aiSummary: submission.aiSummary,
        officerRemarks,
        conflictDetected: true,
        sentimentScore: parsed.sentiment,
        aiReason: parsed.reason,
        conflictType: "SENTIMENT_BASED",
        aiDecision: submission.aiSummary?.decision || null,
        officerDecision: submission.review?.reviewDecision || null,
      });

      // If conflict detected → notify tenant admin
      await sendConflictAlertEmail({
        tenantId,
        submissionId: submission._id.toString(),
        reason: parsed.reason,
      });
    } else {
      console.log("No sentiment-based conflict detected");
    }

    return doc;
  } catch (err) {
    console.error("Conflict Analysis Error:", err);
    return null;
  }
}
