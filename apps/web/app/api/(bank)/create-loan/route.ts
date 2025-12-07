import { NextResponse,NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminToken } from "../../../../utils/verifyToken";
import ConnectDb from "../../../../middleware/connectDb";
import LoanDetails from "../../../../models/LoanDetails";
import Bank from "../../../../models/Bank";
export const GET= async (request: NextRequest) => {
    try{
        await ConnectDb();
        const url = new URL(request.url);
        const {searchParams} =url;
        const id = searchParams.get("id");
        const cookiesStore = await cookies();
        const token = cookiesStore.get("token")?.value;
        const val = verifyAdminToken(token || "");
        const verify = val?.data?.type == "bank";
        if (!val.success || !verify) {
            return NextResponse.json({ message: "Unauthorized access", success: false })
        }
        if(id){
            const data = await (LoanDetails as any).findById(id);
            return NextResponse.json({ message: "Loan Details fetched successfully", data: data, success: true });
        }
   
            const findbank = await Bank.findOne({ ifsc: val?.data?.ifsc } as any);
            if (!findbank) {
                return NextResponse.json({ message: "Bank not found incorrect details", success: false })
            }
            const loandetails = await LoanDetails.find({
                $or: [
                    { bankid: findbank._id },
                    {  }
                ]
            } as any);
            return NextResponse.json({ message: "Loan Details fetched successfully", data: loandetails, success: true });


    }
    catch(err){
        return NextResponse.json({message:"something went wrong please try again after some time",success:false});
    }
}
export const POST = async (request: NextRequest) => {
    try{
          const cookiesStore = await cookies();
        const token = cookiesStore.get("token")?.value;
        const val = verifyAdminToken(token || "");
        const verify = val?.data?.type == "bank";
        if (!val.success || !verify) {
            return NextResponse.json({ message: "Unauthorized access", success: false })
        }
        await ConnectDb();
        const reqBody = await request.json();
        const findbank = await Bank.findOne({ ifsc: val?.data?.ifsc } as any);
        if(!findbank){
            return NextResponse.json({ message: "Bank not found incorrect details", success: false })
        }
        const newLoanDetails = new LoanDetails({...reqBody,bankid:findbank._id,tenantId:findbank.tenantId});
        await newLoanDetails.save();
        return NextResponse.json({message:"Loan Details created successfully",data:newLoanDetails,success:true});
    }
    catch(err){
        return NextResponse.json({message:"something went wrong please try again after some time",success:false});
    }
}
export const PUT = async (request: NextRequest) => {
    try{
        const cookiesStore = await cookies();
        const token = cookiesStore.get("token")?.value;
        const val = verifyAdminToken(token || "");
        const verify = val?.data?.type == "bank";
        if (!val.success || !verify) {
            return NextResponse.json({ message: "Unauthorized access", success: false })
        }
        await ConnectDb();
        const reqBody = await request.json();
        const updatebyid =await (LoanDetails as any).findByIdAndUpdate(reqBody.id,{ $set: reqBody},{new:true} as any);
        return NextResponse.json({message:"Loan Details updated successfully",data:updatebyid,success:true});
    }
    catch(err){
        return NextResponse.json({message:"something went wrong please try again after some time",success:false});
    }
}