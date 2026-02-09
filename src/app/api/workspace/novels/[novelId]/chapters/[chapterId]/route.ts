import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Chapter } from "@/model/Chapter";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, context: { params: Promise<{ chapterId: string }> }) {
    const params = await context.params;
    const chapterId = params.chapterId;

    const currentUser = await getCurrentUser();

    if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        await connectDB();

        const chapter = await Chapter.findById(chapterId).select('_id title content chapterNumber wordCount');
        if (!chapter) return NextResponse.json({ error: 'Không tìm thấy!' }, { status: 404 });
        return NextResponse.json({ chapter }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: 'Lỗi khi lấy dữ liệu' }, { status: 500 });
    }
}

export async function POST(request: NextRequest, context: { params: Promise<{ chapterId: string }> }) {
    const params = await context.params;
    const chapterId = params.chapterId;
    const body = await request.json();
    const { title, content, chapterNumber, wordCount } = body;

    const currentUser = await getCurrentUser();

    if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        await connectDB();

        const chapter = await Chapter.findById(chapterId);
        if (!chapter) return NextResponse.json({ error: 'Không tìm thấy!' }, { status: 404 });

        chapter.title = title;
        chapter.content = content;
        chapter.chapterNumber = chapterNumber;
        chapter.wordCount = wordCount;

        await chapter.save();

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: 'Lỗi khi lấy dữ liệu' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ chapterId: string }> }) {
    const params = await context.params;
    const chapterId = params.chapterId;

    const res = await request.json();
    const { content, wordCount } = res;

    try {
        await connectDB();

        const chapter = await Chapter.findById(chapterId);
        if (!chapter) return NextResponse.json({ error: 'Chương không tồn tại, vui lòng thử lại!' }, { status: 404 });

        chapter.content = content;
        chapter.wordCount = wordCount;

        await chapter.save();
        return NextResponse.json({ success: true }, { status: 200 });
    } catch {
        return NextResponse.json({ error: 'Lỗi khi cập nhật dữ liệu' }, { status: 500 });
    }
}