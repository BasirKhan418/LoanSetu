import { NextRequest,NextResponse } from "next/server";
import ConnectDb from "../../../../../middleware/connectDb";
import jwt from "jsonwebtoken";
import User from "../../../../../models/User";
import { twilioClient,verifyServiceId } from "../../../../../lib/twilio";
export const POST = async (req: NextRequest) => {
    try{
        await ConnectDb();
        const data = await req.json();
        const {phone,otp} = data;
        if(!phone||!otp){
            return NextResponse.json({message:"Phone or OTP missing",success:false})
        }
        const checkuserexistornot = await User.findOne({phone:phone} as any);
        if(!checkuserexistornot){
            return NextResponse.json({message:"User with this phone number does not exist",success:false})
        }
        const verificationCheck = await twilioClient.verify.v2
      .services(verifyServiceId)
      .verificationChecks.create({
        to: `+91${phone}`, // e.g. "+919337203632"
        code: otp, // user manually enters this
      });

    const isApproved = verificationCheck.status === "approved";
    if(!isApproved){
        return NextResponse.json({message:"Invalid OTP",success:false})
    }
    const token = jwt.sign({id:checkuserexistornot._id,type:"user",name:checkuserexistornot.name,email:checkuserexistornot.email},process.env.JWT_SECRET!);
    await (User as any).findByIdAndUpdate(checkuserexistornot._id,{isActive: true} as any);
    return NextResponse.json({message:"User verified successfully",success:true,token:token})

    }
    catch(err){
        return NextResponse.json({message: "Internal Server Error",success:false}, {status: 500});
    }
}