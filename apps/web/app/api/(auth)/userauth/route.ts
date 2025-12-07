import { NextResponse, NextRequest } from "next/server";
import ConnectDb from "../../../../middleware/connectDb";
import User from "../../../../models/User";
import setConnectionRedis from "../../../../middleware/connectRedisClient";
import { cookies } from "next/headers";
import { verifyAdminToken } from "../../../../utils/verifyToken";
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
        const admin = await (Admin as any).findById(data?.data?.id);

        if(!admin){
            return NextResponse.json({message:"Admin not found incorrect details",success:false})
        }
        if(admin.isSuperAdmin){
            const data1  = await User.find({} as any);
            return NextResponse.json({message:"users fetched successfully",data:data1,success:true,type:"superAdmin"})
        }
        const data2 = await User.find({tenantId:admin.tenantId} as any);
        return NextResponse.json({message:"users fetched successfully",data:data2,success:true,type:"normaladmin"})


    }
    catch(err){
        return NextResponse.json({message: "Internal Server Error",success:false}, {status: 500});
    }
}
export const POST = async (req: NextRequest) => {
    try {
        const data = await req.json();
        await ConnectDb();
        const redisClient = setConnectionRedis();
        const cookiesStore = await cookies();

        if (data.type == "CreateUser") {
            //only admin can create user
            const token = cookiesStore.get("token")?.value;
            const val = verifyAdminToken(token || "");
            const isverify = val.data?.type == "admin" || val.data?.type == "bank";
            if (!isverify) {
                return NextResponse.json({ message: "Unauthorized access", success: false })
            }
            const findUser = await User.findOne({ email: data.email } as any);
            if (findUser) {
                return NextResponse.json({ message: "User with this email already exists", success: false })
            }
            const newUser = new User(data);
            await newUser.save();
            return NextResponse.json({ message: "User created successfully", data: newUser, success: true });
        }
        else {
            //send otp to user number
        }
    }
    catch (err) {
        return NextResponse.json({ message: "something went wrong please try again after some time", success: false, error: err })
    }
}

export const PUT = async (req: NextRequest) => {
    try {
        const { _id, ...updateFields } = await req.json();
        await ConnectDb();
        const cookiesStore = await cookies();
        const token = cookiesStore.get("token")?.value;
        const val = verifyAdminToken(token || "");
        const isverify = val.data?.type == "admin" || val.data?.type == "bank" || val.data?.type == "user";
        if (!isverify) {
            return NextResponse.json({ message: "Unauthorized access", success: false })
        }
        const user = await (User as any).findById(_id as string);
        if (!user) {
            return NextResponse.json({ message: "User not found", success: false })
        }
        await User.findByIdAndUpdate(
            _id,
            { $set: updateFields },
            { new: true, includeResultMetadata: true, lean: true }
        );
        return NextResponse.json({ message: "User updated successfully", success: true });
    }
    catch (err) {
        return NextResponse.json({ message: "something went wrong please try again after some time", success: false, error: err })
    }
}