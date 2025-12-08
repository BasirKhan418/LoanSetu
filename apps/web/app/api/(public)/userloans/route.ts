import { NextResponse,NextRequest } from "next/server";

import ConnectDb from "../../../../middleware/connectDb";
import Loans from "../../../../models/Loans";
import User from "../../../../models/User";
import LoanDetails from "../../../../models/LoanDetails";
import Rullset from "../../../../models/Rullset";
export const GET= async (req: NextRequest) => {
    try{
        await ConnectDb();
        void LoanDetails;
        void LoanDetails;
        const url = new URL(req.url);
        const {searchParams} =url;
        const id= searchParams.get("id");
        if(id){
            const finduser = await Loans.find({ tenantId:id} as any) .populate({ path: "beneficiaryId", model: "User" })
  .populate({ path: "loanDetailsId", model: "LoanDetails" },)
  .populate({ path: "createdByBankOfficerId", model: "Bank" })
  .populate({ path: "bankid", model: "Bank" });
  return NextResponse.json({ message: "Loans fetched successfully for tenant", data: finduser, success: true });

        }
        const loans = await Loans.find({} as any) .populate({ path: "beneficiaryId", model: "User" })
  .populate({ path: "loanDetailsId", model: "LoanDetails" })
  .populate({ path: "createdByBankOfficerId", model: "Bank" })
  .populate({ path: "bankid", model: "Bank" });

        return NextResponse.json({ message: "All Loans fetched successfully", data: loans, success: true });

    }
    catch(err:any){
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

export const POST= async (req: NextRequest) => {
    try{
        await ConnectDb();
        
        const data = await req.json();
        const finduser = await User.findOne({ phone: data.phone } as any);
        console.log("Found user:", finduser);
        if(!finduser){
            return NextResponse.json({ message: "User not found", success: false });
        }
        const loans = await Loans.find({ beneficiaryId: finduser._id } as any) .populate({ path: "beneficiaryId", model: "User" })
  .populate({ path: "loanDetailsId", model: "LoanDetails" })
  .populate({ path: "createdByBankOfficerId", model: "Bank" })
  .populate({ path: "bankid", model: "Bank" });
        console.log("Fetched loans:", loans);   

        return NextResponse.json({ message: "User Loans fetched successfully", data: loans, success: true });

    }
    catch(err:any){
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