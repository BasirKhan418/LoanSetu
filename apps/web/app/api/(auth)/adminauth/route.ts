import { NextResponse,NextRequest } from "next/server";
import Admin from "../../../../models/Admin";
import ConnectDb from "../../../../middleware/connectDb";
import setConnectionRedis from "../../../../middleware/connectRedisClient";
import { sendAdminOtpEmail } from "../../../../email/sendAdminOtpEmail";
import { verifyAdminToken } from "../../../../utils/verifyToken";
import { cookies } from "next/headers";
export const POST = async(req:NextRequest)=>{
    try{
        await ConnectDb();
        const data =  await req.json();
        const cookiesStore = await cookies();
        const token = cookiesStore.get("token")?.value;
        const redisClient = setConnectionRedis();
        if(data.type=="createAdmin"){
            //add auth here

        //check admin exist or not
        const val = verifyAdminToken(token||"");
        if(val.data?.type!="admin"){
            return NextResponse.json({message:"Unauthorized access",success:false})
        }
        const findAdmin = await Admin.findOne({ email: data.email } as any);
        if(findAdmin){
            return NextResponse.json({message:"Admin with this email already exists",success:false})
        }
        const newAdmin = new Admin(data);
        await newAdmin.save();
        return NextResponse.json({message:"Admin created successfully",data:newAdmin,success:true});
        }
        else{
            const findAdmin = await Admin.findOne({email:data.email} as any);
            if(!findAdmin){
                return NextResponse.json({message:"Admin not found",success:false})
            }
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            await redisClient.set(`admin-otp-${data.email}`, otp, "EX", 300); // OTP valid for 5 minutes
            console.log("Generated OTP:", otp);
            await sendAdminOtpEmail({ email: data.email, otp ,name:findAdmin.name});
            return NextResponse.json({message:"OTP sent successfully",success:true})

        }
    }
    catch(err){
        console.error("Error in admin auth route:", err);
        return NextResponse.json({message:"something went wrong please try again after some time",success:false})
    }
}