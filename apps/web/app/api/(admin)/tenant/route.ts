import { NextResponse,NextRequest } from "next/server";
import Tenant from "../../../../models/Tenant";
export const GET = async()=>{
    try{
        
        const tenants = await Tenant.find({});

        return NextResponse.json({message:"Tenants fetched successfully",data:tenants,success:true})
    }
    catch(err){
        return NextResponse.json({message:"Error fetching tenants",success:false})
    }
}

export const POST = async(req:NextRequest)=>{
    try{
        const data =  await req.json();
        const findtenant = await Tenant.findOne({code:data.code});
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