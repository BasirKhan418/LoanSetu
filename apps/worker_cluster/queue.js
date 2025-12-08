import Valkey from "ioredis";
const serviceUri = process.env.REDIS_1;
const valkey = new Valkey(serviceUri,{
    maxRetriesPerRequest: null,  // 🚀 Required for BullMQ
  enableReadyCheck: false,     // optional, improves stability in some setups
});
valkey.on("connect", () => {
  console.log("Connected to Valkey Redis successfully!");
});
valkey.on("error", (err) => {
  console.error("Error connecting to Valkey Redis:", err);
});
export default valkey;