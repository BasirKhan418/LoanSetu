import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const POST = async (req: NextRequest) => {
    try {
        const cookiesStore = await cookies();
        
        // Delete the token cookie by setting it with an expired date
        cookiesStore.set({
            name: 'token',
            value: '',
            httpOnly: true,
            sameSite: 'lax',
            expires: new Date(0), // Set expiry to past date
            path: '/',
        });

        return NextResponse.json({ 
            message: "Logged out successfully", 
            success: true 
        }, { status: 200 });
    } catch (err) {
        console.error("Error during logout:", err);
        return NextResponse.json({ 
            message: "Internal Server Error", 
            success: false 
        }, { status: 500 });
    }
}
