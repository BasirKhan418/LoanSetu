import { NextResponse,NextRequest } from "next/server";
import Admin from "../../../../../models/Admin";
import jwt from "jsonwebtoken";
import setConnectionRedis from "../../../../../middleware/connectRedisClient";
import { cookies } from "next/headers";
export const POST = async(req:NextRequest)=>{
    try{
        const data =  await req.json();
        const cookiesStore = await cookies();
        const redisClient = setConnectionRedis();
        const storedOtp = await redisClient.get(`admin-otp-${data.email}`);
        if(storedOtp!==data.otp){
            return NextResponse.json({message:"Invalid or expired OTP",success:false})
        }
        const admin = await Admin.findOne({email:data.email} as any);
        await Admin.updateOne({email:data.email} as any, {isVerified:true});
        if(!admin){
            return NextResponse.json({message:"Admin not found",success:false})
        }
        const token = jwt.sign({ id: admin._id, email: admin.email ,name: admin.name,type:"admin"}, process.env.JWT_SECRET!);
        cookiesStore.set({
            name: 'token',
            value: token,
            httpOnly: true,
            sameSite: 'lax',
        });
        console.log("JWT Secret for signing:", process.env.JWT_SECRET);
        return NextResponse.json({message:"OTP validated successfully", token, success:true});
    }
    catch(err){
        console.error("Error in admin OTP validation route:", err);
        return NextResponse.json({message:"something went wrong please try again after some time",success:false})
    }
}
