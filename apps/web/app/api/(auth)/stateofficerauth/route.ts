import { NextResponse,NextRequest } from "next/server";
import StateOfficer from "../../../../models/StateOfficer";
import ConnectDb from "../../../../middleware/connectDb";
import setConnectionRedis from "../../../../middleware/connectRedisClient";
import { cookies } from "next/headers";
import { verifyAdminToken } from "../../../../utils/verifyToken";
import { sendStateOfficerOtpEmail } from "../../../../email/sendStateOfficerOtpEmail";
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
        const admin = await (Admin as any).findById({_id:data?.data?.id} as any);
        if(!admin){
            return NextResponse.json({message:"Admin not found incorrect details",success:false})
        }
        if(admin.isSuperAdmin){
            const data1  = await StateOfficer.find({} as any);
            return NextResponse.json({message:"state officers fetched successfully",data:data1,success:true,type:"superAdmin"})
        }
        const data2 = await StateOfficer.find({tenantId:admin.tenantId} as any);
        return NextResponse.json({message:"state officers fetched successfully",data:data2,success:true,type:"normaladmin"})


    }
    catch(err){
        return NextResponse.json({message: "Internal Server Error",success:false}, {status: 500});
    }
}
export const POST = async (request: NextRequest) => {
    try{
        const reqBody = await request.json();
        const cookieStore = await cookies();
        const userToken = cookieStore.get("token")?.value || "";
        await ConnectDb();
        const redis = setConnectionRedis();
        if(reqBody.type==="CreateStateOfficer"){
            const verifyToken = verifyAdminToken(userToken);
            if(!verifyToken.success||verifyToken.data?.type!=="admin"){
                return NextResponse.json({message: "Unauthorized",success:false}, {status: 401});
            }
            const stateOff = await StateOfficer.findOne({ email: reqBody.email } as any);
            if(stateOff){
                return NextResponse.json({message: "State Officer already exists",success:false}, {status: 400});
            }
            const newStateOfficer = new StateOfficer(reqBody);
            await newStateOfficer.save();
            return NextResponse.json({message: "State Officer created successfully",success:true}, {status: 201});
        }
        else{
            const stateAdmin = await StateOfficer.findOne({ email: reqBody.email } as any);
            if(!stateAdmin){
                return NextResponse.json({message: "State Officer not found",success:false}, {status: 404});
            }
            const generateotp = Math.floor(100000 + Math.random() * 900000).toString();
            await redis.set(`stateofficer-otp-${reqBody.email}`, generateotp, "EX", 5 * 60);
            await sendStateOfficerOtpEmail({ email: reqBody.email, otp: generateotp, name: stateAdmin.name });
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
        const stateOfficer = await (StateOfficer as any).findById(reqBody.id as string);
        if(!stateOfficer){
            return NextResponse.json({message: "State Officer not found",success:false}, {status: 404});
        }
        const cookiesStore = await cookies();
        const userToken = cookiesStore.get("token")?.value || "";
        const verifyToken = verifyAdminToken(userToken);
        const isitauth =verifyToken.data?.type==="admin"||verifyToken.data?.type==="stateofficer";
        if(!verifyToken.success||!isitauth){
            return NextResponse.json({message: "Unauthorized",success:false}, {status: 401});
        }
        const update = await StateOfficer.updateOne({_id: reqBody.id} as any, reqBody);
        return NextResponse.json({message: "State Officer updated successfully", success:true}, {status: 200});
    }
    catch(err){
        return NextResponse.json({message: "Internal Server Error",success:false}, {status: 500});
    }
}