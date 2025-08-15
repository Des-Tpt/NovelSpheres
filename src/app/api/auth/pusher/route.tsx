import { pusherServer } from "@/lib/pusher-server";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const socket_id = body.socket_id as string;
        const channel_name = body.channel_name as string;

        if (!socket_id || !channel_name) {
            return new NextResponse("Bad Request", { status: 400 });
        }

        const user = await getCurrentUser();

        if (!user || !user._id) {
            return new NextResponse("Unauthorized", { status: 403 });
        } 
        
        const expected = `private-user-${user._id.toString()}`;
        if (channel_name !== expected) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const auth = pusherServer.authorizeChannel(socket_id, channel_name);
        return NextResponse.json(auth);
    } catch (err) {
        console.error("Pusher auth error:", err);
        return new NextResponse("Server error", { status: 500 });
    }
}
