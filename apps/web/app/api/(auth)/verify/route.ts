//single source of truth to verify all endpoint

import { NextResponse,NextRequest } from "next/server";
import Admin from "../../../../models/Admin";
import { verifyAdminToken } from "../../../../utils/verifyToken";
import { cookies } from "next/headers";
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
            const admin = await Admin.findById(data.data?.id);
            return NextResponse.json({message:"Admin fetched successfully",data:admin,success:true,type:"admin"})
        }
        return NextResponse.json({message:"Unauthorized access",success:false})
    }
    catch(err){
        return NextResponse.json({message:"something went wrong please try again after some time",success:false})
    }
}