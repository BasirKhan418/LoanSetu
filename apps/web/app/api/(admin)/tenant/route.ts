import { NextResponse,NextRequest } from "next/server";
import Tenant from "../../../../models/Tenant";
import ConnectDb from "../../../../middleware/connectDb";
export const GET = async()=>{
    try{
        await ConnectDb();
        const tenants = await Tenant.find();

        return NextResponse.json({message:"Tenants fetched successfully",data:tenants,success:true})
    }
    catch(err){
        return NextResponse.json({message:"Error fetching tenants",success:false})
    }
}

export const POST = async(req:NextRequest)=>{
    try{
        await ConnectDb();
        const data =  await req.json();
        const findtenant = await (Tenant as any).findOne({ code: data.code });
        if(findtenant){
            return NextResponse.json({message:"Tenant with this code already exists",success:false})
        }
        const newTenant = new Tenant(data);
        await newTenant.save();
        return NextResponse.json({message:"Tenant created successfully",data:newTenant,success:true});
    }
    catch(err){
        return NextResponse.json({message:"some error ocured while creating tenenat",success:false})
    }

}

export const PUT = async(req:NextRequest)=>{
    try{
        await ConnectDb();
        const data =  await req.json();
        console.log("Updating tenant with data:", data);
        const updatedTenant = await Tenant.findByIdAndUpdate(data.id, data, { new: true, includeResultMetadata: true, lean: true });
        if(!updatedTenant){
            return NextResponse.json({message:"Tenant not found",success:false})
        }
        return NextResponse.json({message:"Tenant updated successfully",data:updatedTenant,success:true});
    }
    catch(err){
        return NextResponse.json({message:"some error ocured while updating tenenat",success:false})
    }
}

export const DELETE = async(req:NextRequest)=>{
    try{
        const data = await req.json();
        await ConnectDb();
        const deletedTenant = await (Tenant as any).findByIdAndDelete(String(data.id));
        if(!deletedTenant){
            return NextResponse.json({message:"Tenant not found",success:false})
        }
        return NextResponse.json({message:"Tenant deleted successfully",data:deletedTenant,success:true});
    }
    catch(err){
        return NextResponse.json({message:"some error ocured while deleting tenenat",success:false})
    }
}