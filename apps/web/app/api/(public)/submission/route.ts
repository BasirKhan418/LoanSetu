import { NextResponse,NextRequest } from "next/server";
import Submission from "../../../../models/Submission";
import { validationQueue } from "../../../../lib/email-queue";
import { verifyAdminToken } from "../../../../utils/verifyToken";
import ConnectDb from "../../../../middleware/connectDb";
import { headers } from "next/headers";
import Loans from "../../../../models/Loans";
import LoanDetails from "../../../../models/LoanDetails";
export const runtime = "nodejs";
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


export const POST= async (req: NextRequest) => {
    try{
        void LoanDetails;
        const headerlist = await headers();
        const token = headerlist.get("token");
       
        const validation = verifyAdminToken(token!);
        console.log(validation);
        if(!validation.success||validation.data?.type!=="user"){
            return NextResponse.json({message:"Unauthorized access",success:false},{status:403});
        }
        await ConnectDb();
        const data = await req.json();
        console.log("Submission data received:", data.loanId);
const loandata = await (Loans as any).findById(data.loanId as any).populate({ path: "loanDetailsId", model: "LoanDetails" });
console.log("Loan data fetched:", loandata);
if(!loandata){
    return NextResponse.json({message:"Invalid Loan ID",success:false});
}
        const newsubmission = new Submission({...data,beneficiaryId:validation.data?.id,rullsetid:loandata.loanDetailsId.rullsetid,tenantId:loandata.tenantId,loanDetailsId:loandata.loanDetailsId});
        await newsubmission.save();
        const job = await validationQueue.add(
      "validate user submission", // job name
      { submission: newsubmission }, // job data
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      }
    );
        //add details in queue it will take and process later
        return NextResponse.json({message:"Submission created successfully",data:newsubmission,success:true});
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
