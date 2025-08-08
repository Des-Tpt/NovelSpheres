import { connectDB } from "@/lib/db";
import { Chapter } from "@/model/Chapter";
import { Novel } from "@/model/Novel";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest, context: { params: { id: string, actId: string } }) {
    try {
        const { id: novelId, actId: actId } = context.params;
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        await connectDB();

        const novel = await Novel.findById(novelId);

        if (userId !== novel.authorId) {
            return NextResponse.json({ error: 'Bạn không có quyền thực hiện thao tác này!' }, { status: 403 });
        }

        const { title, content, chapterNumber, wordCount } = await request.json()

        if (!title || !chapterNumber || !content) {
            return NextResponse.json({ error: 'Vui lòng nhập đầy đủ thông tin!' }, { status: 400 });
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