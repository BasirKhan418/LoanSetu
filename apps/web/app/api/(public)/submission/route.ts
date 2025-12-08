import { NextResponse,NextRequest } from "next/server";
import Submission from "../../../../models/Submission";
import { cookies } from "next/headers";
import { verifyAdminToken } from "../../../../utils/verifyToken";
import ConnectDb from "../../../../middleware/connectDb";
import { headers } from "next/headers";
export const GET = async (req: NextRequest) => {
    try{
        const headerlist = await headers();
        const token = headerlist.get("token");
       
        const validation = verifyAdminToken(token!);
        console.log(validation);
        if(!validation.success||validation.data?.type!=="user"){
            return NextResponse.json({message:"Unauthorized access",success:false},{status:403});
        }
        await ConnectDb();
       
        const allusersubmissions = await Submission.find({beneficiaryId:validation.data?.id} as any);

        return NextResponse.json({message:"User Submissions fetched successfully",data:allusersubmissions,success:true});
    }
    catch(err:any){
        return NextResponse.json(
            {
                message: "Something went wrong, please try again after some time",
                success: false,
                error: err?.message
            },
            { status: 500 }
        );
    }
}