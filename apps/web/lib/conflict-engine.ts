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

    // Store result in DB
    const doc = await ConflictOfInterest.create({
      submissionId: submission._id,
      officerId,
      tenantId,
      aiSummary: submission.aiSummary,
      officerRemarks,
      conflictDetected: parsed.conflict,
      sentimentScore: parsed.sentiment,
      aiReason: parsed.reason,
    });

    // If conflict detected → notify tenant admin
    if (parsed.conflict) {
      await sendConflictAlertEmail({
        tenantId,
        submissionId: submission._id.toString(),
        reason: parsed.reason,
      });
    }

    return doc;
  } catch (err) {
    console.error("Conflict Analysis Error:", err);
    return null;
  }
}
