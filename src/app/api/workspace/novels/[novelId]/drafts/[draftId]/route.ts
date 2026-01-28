import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Draft } from "@/model/Draft";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, context: { params: Promise<{ draftId: string }> }) {
    const params = await context.params;
    const draftId = params.draftId;

    const currentUser = await getCurrentUser();

    if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        await connectDB();

        const draft = await Draft.findById(draftId)
            .select('_id title content chapterNumber wordCount');
        if (!draft) return NextResponse.json({ error: 'Không tìm thấy!' }, { status: 404 });

        return NextResponse.json({ draft }, { status: 200 });
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

        const draft = await Draft.findById(chapterId);
        if (!draft) return NextResponse.json({ error: 'Không tìm thấy!' }, { status: 404 });

        draft.title = title;
        draft.content = content;
        draft.chapterNumber = chapterNumber;
        draft.wordCount = wordCount;

        await draft.save();

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: 'Lỗi khi lấy dữ liệu' }, { status: 500 });
    }
}