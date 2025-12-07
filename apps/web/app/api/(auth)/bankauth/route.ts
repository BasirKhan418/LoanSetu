import { NextResponse,NextRequest } from "next/server";
import Bank from "../../../../models/Bank";
import ConnectDb from "../../../../middleware/connectDb";
import setConnectionRedis from "../../../../middleware/connectRedisClient";
import { cookies } from "next/headers";
import { verifyAdminToken } from "../../../../utils/verifyToken";
import { sendBankOfficerOtpEmail } from "../../../../email/sendBankOfficerOtpEmail";
import Admin from "../../../../models/Admin";
export const GET = async (req: NextRequest) => {
    try{
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;
        if(!token){
            return NextResponse.json({message:"No token provided",success:false})
        }
        const data = verifyAdminToken(token);
        if(!data.success||data?.data?.type!="admin"){
            return NextResponse.json({message:"Unauthorized access",success:false})
        }
        const admin = await Admin.findById({_id:data?.data?.id} as any);
        if(!admin){
            return NextResponse.json({message:"Admin not found incorrect details",success:false})
        }
        if(admin.isSuperAdmin){
            const data1  = await Bank.find({} as any);
            return NextResponse.json({message:"bank officers fetched successfully",data:data1,success:true,type:"superAdmin"})
        }
        const data2 = await Bank.find({tenantId:admin.tenantId} as any);
        return NextResponse.json({message:"bank officers fetched successfully",data:data2,success:true,type:"normaladmin"})


    }
    catch(err){
        return NextResponse.json({message: "Internal Server Error",success:false}, {status: 500});
    }
}
export const POST = async (request: NextRequest) => {
    try{
        await ConnectDb();
        const reqBody = await request.json();
        const cookiesStore = await cookies();
        const userToken = cookiesStore.get("token")?.value || "";
        const redis = setConnectionRedis();
        if(reqBody.type==="CreateBank"){
            const verifyToken = verifyAdminToken(userToken);
            if(!verifyToken.success||verifyToken.data?.type!=="admin"){
                return NextResponse.json({message: "Unauthorized",success:false}, {status: 401});
            }
            const bank = await Bank.findOne({ifsc: reqBody.ifsc } as any);
            if(bank){
                return NextResponse.json({message: "Bank with this IFSC already exists",success:false}, {status: 400});
            }
            const newBank = new Bank(reqBody);
            await newBank.save();
            return NextResponse.json({message: "Bank created successfully",success:true}, {status: 201});

        }
        else{
            const bank = await Bank.findOne({ifsc: reqBody.ifsc } as any);
            if(!bank){
                return NextResponse.json({message: "Bank not found",success:false}, {status: 404});
            }
            const generateotp = Math.floor(100000 + Math.random() * 900000).toString();
            await redis.set(`bank-otp-${reqBody.ifsc}`, generateotp, "EX", 5 * 60);
            //send email or sms with otp here
            await sendBankOfficerOtpEmail({ email: bank.contactEmail!, otp: generateotp, name: bank.contactName!, bankName: `${bank.name} - ${bank.branchName}` });
            return NextResponse.json({message: "OTP generated successfully", success:true}, {status: 200});

        }
    }
    catch(err){
        return NextResponse.json({message: "Internal Server Error",success:false}, {status: 500});
    }
}

export const PUT = async (request: NextRequest) => {
    try{
        await ConnectDb();
        const reqBody = await request.json();
        const bank = await (Bank as any).findById(reqBody.id as string);
        if(!bank){
            return NextResponse.json({message: "Bank not found",success:false}, {status: 404});
        }
        const cookiesStore = await cookies();
        const userToken = cookiesStore.get("token")?.value || "";
        const verifyToken = verifyAdminToken(userToken);
        if(!verifyToken.success||verifyToken.data?.type!=="admin"){
            return NextResponse.json({message: "Unauthorized",success:false}, {status: 401});
        }
        const update = await Bank.updateOne({_id: reqBody.id} as any, reqBody);
        return NextResponse.json({message: "Bank updated successfully", success:true}, {status: 200});
    }
    catch(err){
        return NextResponse.json({message: "Internal Server Error",success:false}, {status: 500});
    }
}