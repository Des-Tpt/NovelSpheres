import { connectDB } from "@/lib/db";
import { Notification } from "@/model/Notification";
import { Novel } from "@/model/Novel";
import { Rating } from "@/model/Rating";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {

        const { id: novelId } = await context.params;

        await connectDB();

        const novel = await Novel.findById(novelId);
        if (!novel) return NextResponse.json({ error: 'Không tim thấy tiểu thuyết!' }, { status: 404 })

        const ratings = await Rating.find({ novelId })
            .select('userId score rate createdAt')
            .populate({ path: "userId", select: "username _id role" })
            .limit(3)
            .sort({ createdAt: -1 })

        if (ratings) {
            return NextResponse.json(ratings);
        }
    } catch {
        return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
    }
}
