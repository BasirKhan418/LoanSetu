import { NextResponse,NextRequest } from "next/server";
export const GET = async()=>{
try{
    return NextResponse.json({message:"get endpoint for hello world working"})
}
catch(err){
    return NextResponse.json({message:"Hello World"})
}
}