import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { NextResponse } from "next/server";
import { Chapter } from "@/model/Chapter";

export async function GET(request: NextRequest, context: { params: Promise<{ actId: string }> }) {
    try {
        await connectDB();
        const { actId } = await context.params;
        const chapters = await Chapter.find({ actId })
            .sort({ chapterNumber: 1 })
            .select('_id actId title chapterNumber updatedAt');

        const totalChapters = await Chapter.countDocuments({ actId });

        return NextResponse.json({
            success: true,
            data: chapters,
            totalChapters
        }, { status: 200 });
    } catch (e) {
        console.log(e);
        return NextResponse.json({ success: false, message: 'Lỗi server' }, { status: 500 });
    }
}