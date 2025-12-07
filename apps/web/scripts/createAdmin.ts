import mongoose from "mongoose";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import Admin from "../models/Admin";
import Tenant from "../models/Tenant";

const createAdmin = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI environment variable is required");
    }

    await mongoose.connect(mongoUri);
    console.log("MongoDB connected successfully");

    const email = "aniketsubudhi00@gmail.com";
    const name = "Aniket Subudhi";
    const state = "admin";

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      console.log(`Admin with email ${email} already exists`);
      process.exit(0);
    }

    // Find or create a default tenant for admin users
    let tenant = await Tenant.findOne({ code: "ADMIN" });
    if (!tenant) {
      tenant = new Tenant({
        name: "Admin Tenant",
        code: "ADMIN",
        isActive: true,
      });
      await tenant.save();
      console.log("Created default admin tenant");
    }

    // Create the admin
    const newAdmin = new Admin({
      name,
      email,
      state,
      tenantId: tenant._id,
      isActive: true,
      isVerified: true,
    });

    await newAdmin.save();
    console.log(`Admin created successfully:`);
    console.log(`  Name: ${name}`);
    console.log(`  Email: ${email}`);
    console.log(`  State: ${state}`);
    console.log(`  Tenant: ${tenant.name} (${tenant.code})`);

    process.exit(0);
  } catch (error) {
    console.error("Error creating admin:", error);
    process.exit(1);
  }
};

createAdmin();
