import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Act } from "@/model/Act";
import { Draft } from "@/model/Draft";
import { Novel } from "@/model/Novel";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest, context: { params: Promise<{ novelId: string }> }) {
    const { novelId } = await context.params;
    const body = await request.json();
    const { actId, chapterNumber, title, content, wordCount } = body;

    const currentUser = await getCurrentUser();
    if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!actId || !chapterNumber || !title) {
        return NextResponse.json({ error: 'Thiếu thông tin bắt buộc!' }, { status: 400 });
    }

    try {
        await connectDB();

        const novel = await Novel.findById(novelId);
        if (!novel) return NextResponse.json({ error: 'Không tìm thấy tiểu thuyết!' }, { status: 404 });

        const act = await Act.findById(actId);
        if (!act) return NextResponse.json({ error: 'Không tìm thấy hồi!' }, { status: 404 });

        const draft = await Draft.findOneAndUpdate(
            { novelId, actId, chapterNumber },
            {
                $set: { title, content, wordCount, updatedAt: new Date() },
                $setOnInsert: { novelId, actId, chapterNumber, createdAt: new Date() }
            },
            { upsert: true, new: true }
        );

        return NextResponse.json({ success: true, draft }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: 'Lỗi khi lưu bản nháp!' }, { status: 500 });
    }
}
