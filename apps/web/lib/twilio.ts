import twilio from "twilio";

const accountSid = process.env.TWILLIO_ACCOUNT_ID!;
const authToken = process.env.TWILLIO_AUTH_TOKEN!;
const verifyServiceSid = process.env.TWILLIO_SERVICE_ID!;

if (!accountSid || !authToken || !verifyServiceSid) {
  throw new Error("Twilio env vars are missing");
}

export const twilioClient = twilio(accountSid, authToken);
export const verifyServiceId = verifyServiceSid;