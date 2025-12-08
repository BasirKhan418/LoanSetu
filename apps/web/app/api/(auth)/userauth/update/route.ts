import { NextResponse,NextRequest } from "next/server";
import { headers } from "next/headers";
import ConnectDb from "../../../../../middleware/connectDb";
import User from "../../../../../models/User";
import { verifyAdminToken } from "../../../../../utils/verifyToken";
export const PUT = async (req: NextRequest) => {
    try {
        const { _id, ...updateFields } = await req.json();
        await ConnectDb();
        const headerlist = await headers();
        const token = headerlist.get("token");
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