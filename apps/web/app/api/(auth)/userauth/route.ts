import { NextResponse,NextRequest } from "next/server";
import ConnectDb from "../../../../middleware/connectDb";
import User from "../../../../models/User";
import setConnectionRedis from "../../../../middleware/connectRedisClient";
import { cookies } from "next/headers";
export async function GET(request: NextRequest) {
    try{
        const url = new URL(request.url);
        const {searchParams} = url;
        await ConnectDb();
        console.log("Connecting to database",searchParams.get("email"));
        return NextResponse.json({message:"Database connected"}, {status:200});
    }
    catch(err){
        return NextResponse.json({error:"Internal Server Error"}, {status:500});
    }
}