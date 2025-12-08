import { NextResponse, NextRequest } from "next/server";
import Loans from "../../../../models/Loans";
import ConnectDb from "../../../../middleware/connectDb";
import { verifyAdminToken } from "../../../../utils/verifyToken";
import LoanDetails from "../../../../models/LoanDetails";
import User from "../../../../models/User";
import { cookies } from "next/headers";
import Bank from "../../../../models/Bank";

export const GET= async (req: NextRequest) => {
    try{
        void LoanDetails; 
        await ConnectDb();
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;
        if (!token) {
            return NextResponse.json(
                { message: "Authentication token missing", success: false },
                { status: 401 }
            );
        }
        const validation = verifyAdminToken(token!);
        if (!validation.success || validation.data?.type !== "bank") {
            return NextResponse.json(
                { message: "Unauthorized access", success: false },
                { status: 403 }
            );
        }
        const bankIfsc = validation.data?.ifsc;
        if (!bankIfsc) {
            return NextResponse.json(
                { message: "Bank IFSC not found in token", success: false },
                { status: 400 }
            );
        }
        const fetchbankDetails = await Bank.findOne({ ifsc: bankIfsc } as any);
        if (!fetchbankDetails) {
            return NextResponse.json(
                { message: "Bank details not found", success: false },
                { status: 404 }
            );
        }
        const bankId = fetchbankDetails._id;
        const loans = await Loans.find({ bankid: bankId } as any)
  .populate({ path: "beneficiaryId", model: "User" })
  .populate({ path: "loanDetailsId", model: "LoanDetails" })
  .populate({ path: "createdByBankOfficerId", model: "Bank" })
  .populate({ path: "bankid", model: "Bank" });


        return NextResponse.json(
            {
                message: "Loans fetched successfully",
                success: true,
                data: loans
            },
            { status: 200 }
        );

    }
    catch(err:any){
        console.log("Error in GET /api/(bank)/loans:", err);
        return NextResponse.json(
            {
                message: "Something went wrong, please try again after some time",
                success: false,
                error: err?.message
            },
            { status: 500 }
        );
    }
}
export const POST = async (req: NextRequest) => {
  try {
    // 1. Auth
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { message: "Authentication token missing", success: false },
        { status: 401 }
      );
    }

    const validation = verifyAdminToken(token!);
    if (!validation.success || validation.data?.type !== "bank") {
      return NextResponse.json(
        { message: "Unauthorized access", success: false },
        { status: 403 }
      );
    }

    // 2. Parse body ONCE
    const body = await req.json();
    const { users, loans } = body as {
      users: any[];
      loans: any[];
    };

    if (!Array.isArray(users) || !Array.isArray(loans)) {
      return NextResponse.json(
        {
          message: "Invalid payload: 'users' and 'loans' must be arrays",
          success: false
        },
        { status: 400 }
      );
    }

    if (users.length === 0 || loans.length === 0) {
      return NextResponse.json(
        {
          message: "'users' and 'loans' arrays cannot be empty",
          success: false
        },
        { status: 400 }
      );
    }

    if (users.length !== loans.length) {
      return NextResponse.json(
        {
          message:
            "users.length and loans.length mismatch. One user should map to one loan by index.",
          success: false
        },
        { status: 400 }
      );
    }

    // 3. DB + bank lookup
    await ConnectDb();

    const bankIfsc = validation.data?.ifsc;
    console.log("Bank IFSC from token:", validation,bankIfsc);
    if (!bankIfsc) {
      return NextResponse.json(
        { message: "Bank IFSC not found in token", success: false },
        { status: 400 }
      );
    }

    const fetchbankDetails = await Bank.findOne({ ifsc: bankIfsc } as any);
    console.log("Fetched bank details:", fetchbankDetails);
    if (!fetchbankDetails) {
      return NextResponse.json(
        { message: "Bank details not found", success: false },
        { status: 404 }
      );
    }

    const bankId = fetchbankDetails._id;
    const tenantId = fetchbankDetails.tenantId;

    // 4. Process each user+loan pair safely
    let successCount = 0;
    let failureCount = 0;
    const errors: { index: number; reason: string }[] = [];

    for (let i = 0; i < users.length; i++) {
      const userPayload = users[i];
      const loanPayload = loans[i];

      try {
        if (!userPayload || !userPayload.phone) {
          throw new Error("User or user.phone is missing");
        }

        if (!loanPayload) {
          throw new Error("Loan object missing for this user index");
        }

        if (!loanPayload.loanNumber) {
          throw new Error("loanNumber is required");
        }

        if (!loanPayload.loanDetailsId) {
          throw new Error("loanDetailsId is required");
        }

        if (!loanPayload.sanctionAmount) {
          throw new Error("sanctionAmount is required");
        }

        // 4.1. Find or create user by phone
        let userDoc = await User.findOne({ phone: userPayload.phone } as any);

        if (!userDoc) {
          userDoc = await User.create({
            name: userPayload.name,
            phone: userPayload.phone,
            email: userPayload.email,
            img: userPayload.img,
            addressLine1: userPayload.addressLine1,
            addressLine2: userPayload.addressLine2,
            village: userPayload.village,
            block: userPayload.block,
            district: userPayload.district,
            state: userPayload.state,
            pincode: userPayload.pincode,
            homeLat: userPayload.homeLat,
            homeLng: userPayload.homeLng,
            tenantId: tenantId || userPayload.tenantId,
            isActive: true,
            isVerified: userPayload.isVerified ?? false
          });
        }

        // 4.2. Create loan mapped to that user + bank
        const sanctionDate = loanPayload.sanctionDate
          ? new Date(loanPayload.sanctionDate)
          : new Date();

        const loanDoc = new Loans({
          ...loanPayload,
          beneficiaryId: userDoc._id,          // override whatever client sent
          createdByBankOfficerId: fetchbankDetails._id,
          tenantId: tenantId || loanPayload.tenantId,
          bankid: bankId,                      // always enforced from bank record
          sanctionDate,
          disbursementMode: loanPayload.disbursementMode || "FULL"
        });

        await loanDoc.save();
        successCount++;
      } catch (err: any) {
        failureCount++;

        let reason = err?.message || "Unknown error";

        // Handle duplicate key (e.g. loanNumber unique)
        if (err?.code === 11000) {
          reason = "Duplicate key error (probably loanNumber already exists)";
        }

        errors.push({ index: i, reason });
        // Continue with next pair instead of failing whole batch
      }
    }

    return NextResponse.json(
      {
        message: `Loans processed. Success: ${successCount}, Failures: ${failureCount}`,
        success: failureCount === 0,
        summary: {
          successCount,
          failureCount,
          errors
        }
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Bulk loan creation error:", err);
    return NextResponse.json(
      {
        message: "Something went wrong, please try again after some time",
        success: false,
        error: err?.message
      },
      { status: 500 }
    );
  }
};

export const PUT = async (req: NextRequest) => {
    try{
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;
        if (!token) {
            return NextResponse.json(
                { message: "Authentication token missing", success: false },
                { status: 401 }
            );
        }
        const validation = verifyAdminToken(token!);
        if (!validation.success || validation.data?.type !== "bank") {
            return NextResponse.json(
                { message: "Unauthorized access", success: false },
                { status: 403 }
            );
        }
        await ConnectDb();
        const body = await req.json();
        const updateloan = await Loans.findByIdAndUpdate(body.id, { $set: body }, { new: true } as any);
        return NextResponse.json({message:"Loan updated successfully",success:true,loan:updateloan});
    }
    catch(err){
        return NextResponse.json({message:"something went wrong please try again after some time",success:false});
    }
}