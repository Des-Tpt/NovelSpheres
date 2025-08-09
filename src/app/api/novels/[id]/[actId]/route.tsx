import { connectDB } from "@/lib/db";
import { Act } from "@/model/Act";
import { Chapter } from "@/model/Chapter";
import { Novel } from "@/model/Novel";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string, actId: string }> }) {
    try {
        const { id: novelId, actId: actId } = await context.params;

        await connectDB();

        const { userId, title, content, chapterNumber, wordCount } = await request.json()

        const novel = await Novel.findById(novelId);

        if (!novel) {
            return NextResponse.json({ error: 'Novel không tồn tại!' }, { status: 404 });
        }

        if (userId !== novel.authorId.toString()) {
            return NextResponse.json({ error: 'Bạn không có quyền thực hiện thao tác này!' }, { status: 403 });
        }

        if (!title || !chapterNumber || !content) {
            return NextResponse.json({ error: 'Vui lòng nhập đầy đủ thông tin!' }, { status: 400 });
        }

        const act = await Act.findOne({ _id: actId, novelId: novelId });
        if (!act) {
            return NextResponse.json({ error: 'Act không tồn tại hoặc không thuộc về novel này!' }, { status: 404 });
        }

        const existingChapter = await Chapter.findOne({ actId: actId, chapterNumber: chapterNumber });

        if (existingChapter) {
            return NextResponse.json({
                error: `Chapter số ${chapterNumber} đã tồn tại trong Act này! Vui lòng chọn số thứ tự khác.`
            }, { status: 409 });
        }

        const newChapter = new Chapter({
            novelId: novelId,
            actId: actId,
            content: content,
            title: title,
            chapterNumber: chapterNumber,
            wordCount: wordCount,
            createdAt: new Date(),
            updatedAt: new Date(),
        })
        await newChapter.save();

        return NextResponse.json({ success: true, }, { status: 201 });

    } catch (error) {
        console.error('Lỗi khi tạo act:', error);
        return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
    }
}