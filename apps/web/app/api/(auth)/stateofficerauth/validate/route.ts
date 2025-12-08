import { NextResponse,NextRequest } from "next/server";
import StateOfficer from "../../../../../models/StateOfficer";
import jwt from "jsonwebtoken";
import setConnectionRedis from "../../../../../middleware/connectRedisClient";
import ConnectDb from "../../../../../middleware/connectDb";
import { cookies } from "next/headers";
export const POST = async(req:NextRequest)=>{
    try{
        const data =  await req.json();
        const cookiesStore = await cookies();
        await ConnectDb();
        const redisClient = setConnectionRedis();
        const storedOtp = await redisClient.get(`stateofficer-otp-${data.email}`);
        if(storedOtp!==data.otp){
            return NextResponse.json({message:"Invalid or expired OTP",success:false})
        }
        const stateOfficer = await StateOfficer.findOne({email:data.email} as any);
        await StateOfficer.updateOne({email:data.email} as any,{isVerified:true});
        const token = jwt.sign({ id: stateOfficer!._id, email: stateOfficer!.email ,name: stateOfficer!.name,type:"stateofficer"}, process.env.JWT_SECRET!);
          cookiesStore.set({
            name: 'token',
            value: token,
            httpOnly: true,
            sameSite: 'lax',
        });
        return NextResponse.json({message:"OTP verified successfully",success:true, token});
    }
    catch(err){
        return NextResponse.json({message:"something went wrong please try again after some time",success:false})
    }
}