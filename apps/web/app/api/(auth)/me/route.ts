import { NextResponse, NextRequest } from "next/server";
import ConnectDb from "../../../../middleware/connectDb";
import User from "../../../../models/User";
import { cookies } from "next/headers";
import { verifyAdminToken } from "../../../../utils/verifyToken";

// GET - Fetch current user's data
export const GET = async () => {
    try {
        await ConnectDb();
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;
        
        if (!token) {
            return NextResponse.json({ message: "No token provided", success: false }, { status: 401 });
        }
        
        const data = verifyAdminToken(token);
        
        if (!data.success || data?.data?.type !== "user") {
            return NextResponse.json({ message: "Unauthorized access", success: false }, { status: 403 });
        }
        
        const user = await (User as any).findById(data?.data?.id);
        
        if (!user) {
            return NextResponse.json({ message: "User not found", success: false }, { status: 404 });
        }
        
        return NextResponse.json({
            message: "User data fetched successfully",
            data: user,
            success: true,
        });
    } catch (err) {
        console.error("Error fetching user data:", err);
        return NextResponse.json({ message: "Internal Server Error", success: false }, { status: 500 });
    }
};

// PUT - Update current user's data
export const PUT = async (req: NextRequest) => {
    try {
        const updateFields = await req.json();
        await ConnectDb();
        const cookiesStore = await cookies();
        const token = cookiesStore.get("token")?.value;
        
        if (!token) {
            return NextResponse.json({ message: "No token provided", success: false }, { status: 401 });
        }
        
        const data = verifyAdminToken(token);
        
        if (!data.success || data?.data?.type !== "user") {
            return NextResponse.json({ message: "Unauthorized access", success: false }, { status: 403 });
        }
        
        const userId = data?.data?.id;
        
        const user = await (User as any).findById(userId);
        if (!user) {
            return NextResponse.json({ message: "User not found", success: false }, { status: 404 });
        }
        
        // Update user with the provided fields
        const updatedUser = await (User as any).findByIdAndUpdate(
            userId,
            { $set: updateFields },
            { new: true, lean: true }
        );
        
        return NextResponse.json({
            message: "User updated successfully",
            success: true,
            data: updatedUser,
        });
    } catch (err) {
        console.error("Error updating user:", err);
        return NextResponse.json({ message: "Something went wrong, please try again later", success: false }, { status: 500 });
    }
};
