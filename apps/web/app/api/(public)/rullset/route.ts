import { NextResponse, NextRequest } from "next/server";
import { verifyAdminToken } from "../../../../utils/verifyToken";
import { cookies } from "next/headers";
import Rullset from "../../../../models/Rullset";
import ConnectDb from "../../../../middleware/connectDb";
import Bank from "../../../../models/Bank";
import StateOfficer from "../../../../models/StateOfficer";
export const GET = async (req: NextRequest) => {
    try {
        await ConnectDb();
        const url = new URL(req.url);
        const { searchParams } = url;
        const id = searchParams.get("id");
        const cookiesStore = await cookies();
        const token = cookiesStore.get("token")?.value;
        const val = verifyAdminToken(token || "");
        const verify = val?.data?.type == "user" || val?.data?.type == "bank" || val?.data?.type == "stateofficer"||val?.data?.type=="admin";
        if (!val.success || !verify) {
            return NextResponse.json({ message: "Unauthorized access", success: false })
        }
        if (id) {
            const data = await (Rullset as any).findById(id);
            return NextResponse.json({ message: "Rullset fetched successfully for admin", data: data, success: true });
        }
        if (val?.data?.type == "bank") {
            const findbank = await Bank.findOne({ ifsc: val?.data?.ifsc } as any);
            if (!findbank) {
                return NextResponse.json({ message: "Bank not found incorrect details", success: false })
            }
            const rullsets = await Rullset.find({
                $or: [
                    { tenantId: findbank.tenantId },
                    { isApplicableToAll: true }
                ]
            } as any);
            return NextResponse.json({ message: "Rullsets fetched successfully", data: rullsets, success: true });
        }
        else if(val?.data?.type=="stateofficer"){
            const findStateOfficer = await( StateOfficer as any).findById({_id:val?.data?.id} as any);
            if(!findStateOfficer){
                return NextResponse.json({message:"State Officer not found incorrect details",success:false})
            }
            const rullsets = await Rullset.find({
                $or: [
                    { tenantId: findStateOfficer.tenantId },
                    { isApplicableToAll: true }
                ]
            } as any);
            return NextResponse.json({ message: "Rullsets fetched successfully", data: rullsets, success: true });
        }
        return NextResponse.json({ message: "Unauthorized access no method allowed", success: false })

    }
    catch (err) {
        return NextResponse.json({ message: "something went wrong please try again after some time", success: false });
    }
}