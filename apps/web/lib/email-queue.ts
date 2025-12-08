// lib/email-queue.js
import { Queue } from "bullmq";
import setConnectionRedis from "../middleware/connectRedisClient";

export const validationQueue = new Queue("validationQueue", {
  connection: setConnectionRedis(),
});
