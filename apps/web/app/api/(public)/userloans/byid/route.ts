import { NextResponse,NextRequest } from "next/server";

import ConnectDb from "../../../../../middleware/connectDb";
import Loans from "../../../../../models/Loans";
import User from "../../../../../models/User";
import LoanDetails from "../../../../../models/LoanDetails";
import Rullset from "../../../../../models/Rullset";
export const GET= async (req: NextRequest) => {
    try{
        await ConnectDb();
        void LoanDetails;
        void User;  
        const url = new URL(req.url);
        const {searchParams} =url;
        const id= searchParams.get("id");
        if(!id){
            return NextResponse.json({ message: "Loan ID is required", success: false });
        }
        
        
        const loans = await (Loans as any).findById(id) .populate({ path: "beneficiaryId", model: "User" })
  .populate({ path: "loanDetailsId", model: "LoanDetails" })
        console.log("Fetched loans:", loans);   
        if(!loans||loans.length===0){
            return NextResponse.json({ message: "No loans found for this user", success: false });
        }
        const findruleset = await Rullset.findOne({ _id: loans.loanDetailsId.rullsetid } as any);

        return NextResponse.json({ message: "User Loans fetched successfully", data: loans, success: true ,rulelset:findruleset});

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