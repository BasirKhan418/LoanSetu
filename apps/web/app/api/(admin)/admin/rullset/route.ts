import { NextResponse,NextRequest } from "next/server";
import { verifyAdminToken } from "../../../../../utils/verifyToken";
import Rullset from "../../../../../models/Rullset";
import Admin from "../../../../../models/Admin";
import { cookies } from "next/headers";
import ConnectDb from "../../../../../middleware/connectDb";
export const GET = async(req:NextRequest)=>{
    try{
        await ConnectDb();
        const url = new URL(req.url);
        const {searchParams} =url;
        const id = searchParams.get("id");
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;
        const data = verifyAdminToken(token||"");
        if(!data.success||data?.data?.type!="admin"){
            return NextResponse.json({message:"Unauthorized access",success:false})
        }
        if(id){
            const rullset = await (Rullset as any).findById(id as string);
            return NextResponse.json({message:"Rullset fetched successfully for admin",data:rullset,success:true});
        }
        const admin = await (Admin as any).findById({_id:data?.data?.id} as any);
        if(!admin){
            return NextResponse.json({message:"Admin not found incorrect details",success:false})
        }
        if(admin.isSuperAdmin){
            const rullsets = await (Rullset as any).find({} as any);
            return NextResponse.json({message:"Rullsets fetched successfully",data:rullsets,success:true,type:"superAdmin"})
        }
        const rullsets = await (Rullset as any).find({tenantId:admin.tenantId} as any);
        return NextResponse.json({message:"Rullsets fetched successfully",data:rullsets,success:true,type:"normaladmin"})
    }
    catch(err){
        return NextResponse.json({message:"something went wrong please try again after some time",success:false});
    }
}

export const POST = async(req:NextRequest)=>{
    try{
        const reqBody = await req.json();
        await ConnectDb();
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;
        const data = verifyAdminToken(token||"");
        if(!data.success||data?.data?.type!="admin"){
            return NextResponse.json({message:"Unauthorized access",success:false})
        }
        const admin = await (Admin as any).findById({_id:data?.data?.id} as any);
        if(!admin){
            return NextResponse.json({message:"Admin not found incorrect details",success:false})
        }
        const newRullset = new Rullset(reqBody);
        await newRullset.save();
        return NextResponse.json({message:"Rullset created successfully",data:newRullset,success:true});

    }
    catch(err){
        return NextResponse.json({message:"something went wrong please try again after some time",success:false});
    }
}

export const PUT = async(req:NextRequest)=>{
    try{
         const reqBody = await req.json();
        await ConnectDb();
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;
        const data = verifyAdminToken(token||"");
        if(!data.success||data?.data?.type!="admin"){
            return NextResponse.json({message:"Unauthorized access",success:false})
        }
        const rullset = await Rullset.findByIdAndUpdate(reqBody.id,{ $set: reqBody},{new:true} as any);
        if(rullset){
            return NextResponse.json({message:"Rullset updated successfully",data:rullset,success:true});
        }
        return NextResponse.json({message:"Rullset not found",success:false});

    }
    catch(err){
       return NextResponse.json({message:"something went wrong please try again after some time",success:false});
    }
}