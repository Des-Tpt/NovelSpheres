import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Draft } from "@/model/Draft";
import { Act } from "@/model/Act";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, context: { params: Promise<{ draftId: string }> }) {
    const params = await context.params;
    const draftId = params.draftId;

    const currentUser = await getCurrentUser();

    if (!currentUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

export async function PATCH(request: NextRequest, context: { params: Promise<{ draftId: string }> }) {
    const params = await context.params;
    const draftId = params.draftId;
    const body = await request.json();
    const { title, content, chapterNumber, wordCount } = body;

    const currentUser = await getCurrentUser();

    if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        await connectDB();

        const draft = await Draft.findById(draftId);
        if (!draft) return NextResponse.json({ error: 'Không tìm thấy!' }, { status: 404 });

        if (title !== undefined) draft.title = title;
        if (content !== undefined) draft.content = content;
        if (chapterNumber !== undefined) draft.chapterNumber = chapterNumber;
        if (wordCount !== undefined) draft.wordCount = wordCount;

        await draft.save();

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: 'Lỗi khi lấy dữ liệu' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ novelId: string; draftId: string }> }) {
    const { draftId } = await context.params;

    const currentUser = await getCurrentUser();
    if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        await connectDB();

        const draft = await Draft.findById(draftId);
        if (!draft) return NextResponse.json({ error: 'Không tìm thấy bản nháp!' }, { status: 404 });

        await Draft.findByIdAndDelete(draftId);

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: 'Lỗi khi xóa bản nháp!' }, { status: 500 });
    }
}