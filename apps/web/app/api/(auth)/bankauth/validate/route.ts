import { NextRequest,NextResponse } from "next/server";
import Bank from "../../../../../models/Bank";
import jwt from "jsonwebtoken";
import setConnectionRedis from "../../../../../middleware/connectRedisClient";
import ConnectDb from "../../../../../middleware/connectDb";
export const POST = async(req:NextRequest)=>{
    try{
        const data =  await req.json();
        await ConnectDb();
        const redisClient = setConnectionRedis();
        const searchBank = await Bank.findOne({ifsc: data.ifsc } as any);
        if(!searchBank){
            return NextResponse.json({message:"Bank not found",success:false})
        }
        const storedOtp = await redisClient.get(`bank-otp-${data.ifsc}`);
        if(storedOtp!==data.otp){
            return NextResponse.json({message:"Invalid or expired OTP",success:false})
        }
        const token = jwt.sign({ ifsc: data.ifsc ,type:"bank",name: searchBank.name,contactName: searchBank.contactName,contactEmail: searchBank.contactEmail}, process.env.JWT_SECRET!);
        return NextResponse.json({message:"OTP verified successfully",success:true, token} );
    }
    catch(err){
        return NextResponse.json({message:"something went wrong please try again after some time",success:false})
    }
}