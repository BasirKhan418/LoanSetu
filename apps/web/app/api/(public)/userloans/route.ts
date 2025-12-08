import { NextResponse,NextRequest } from "next/server";

import ConnectDb from "../../../../middleware/connectDb";
import Loans from "../../../../models/Loans";

import User from "../../../../models/User";

export const POST= async (req: NextRequest) => {
    try{
        await ConnectDb();
        
        const data = await req.json();
        const finduser = await User.findOne({ phone: data.phone } as any);
        console.log("Found user:", finduser);
        if(!finduser){
            return NextResponse.json({ message: "User not found", success: false });
        }
        const loans = await Loans.find({ beneficiaryId: finduser._id } as any)
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