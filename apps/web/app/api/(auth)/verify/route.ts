//single source of truth to verify all endpoint

import { NextResponse,NextRequest } from "next/server";
import Admin from "../../../../models/Admin";
import { verifyAdminToken } from "../../../../utils/verifyToken";
import { cookies } from "next/headers";
import StateOfficer from "../../../../models/StateOfficer";
import Bank from "../../../../models/Bank";
import User from "../../../../models/User";
export const GET = async()=>{
    try{
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;
        console.log("Token from cookies:", token);
        if(!token){
            return NextResponse.json({message:"No token provided",success:false})
        }
        const data = verifyAdminToken(token);
        console.log("Verified token data:", data);
        if(!data.success){
            return NextResponse.json({message:"Invalid token",success:false})
        }
        if(data.data?.type=="admin"){
            const admin = await Admin.findById({_id:data?.data?.id});
            return NextResponse.json({message:"Admin fetched successfully",data:admin,success:true,type:"admin"})
        }
        else if(data.data?.type=="stateOfficer"){
            const stateOfficer = await StateOfficer.findById({_id:data?.data?.id});
            return NextResponse.json({message:"State Officer fetched successfully",data:stateOfficer,success:true,type:"stateOfficer"})
        }
        else if(data.data?.type=="bank"){
            const bank = await Bank.findById({_id:data?.data?.id});
            return NextResponse.json({message:"Bank fetched successfully",data:bank,success:true,type:"bank"})
        }
        else if(data.data?.type=="user"){
            const user = await User.findById({_id:data?.data?.id});
            return NextResponse.json({message:"User access verified",success:true,type:"user"})
        }
        return NextResponse.json({message:"Unauthorized access or no method allowed for this",success:false})
    }
    catch(err){
        return NextResponse.json({message:"something went wrong please try again after some time",success:false})
    }
}