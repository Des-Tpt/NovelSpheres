import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Act } from "@/model/Act";
import { Chapter } from "@/model/Chapter";
import { Draft } from "@/model/Draft";
import { Novel } from "@/model/Novel";
import { NextRequest, NextResponse } from "next/server";
import { success } from "zod/v4";

export async function GET(req: NextRequest, context: { params: Promise<{ novelId: string }> }) {
    const params = await context.params;
    const novelId = params.novelId;

    const currentUser = await getCurrentUser();

    if (!currentUser) return NextResponse.json({ error: 'Lỗi xác thực, vui lòng đăng nhập lại!' }, { status: 401 });

    try {

        const acts = await Act.find({ novelId });
        const chapters = await Chapter.find({ novelId })
            .select('_id title actId chapterNumber wordCount');
        const drafts = await Draft.find({ novelId })
            .select('_id title actId chapterNumber wordCount');

        if (!acts || !chapters || !drafts) return NextResponse.json({ error: 'Không tìm thấy!' }, { status: 404 });

        const responseData: any[] = [];

        acts.forEach(act => {
            const actChapters = chapters.filter(chapter => chapter.actId.toString() === act._id.toString());
            const actDrafts = drafts.filter(draft => draft.actId.toString() === act._id.toString());

            actChapters.sort((a, b) => a.chapterNumber - b.chapterNumber);
            actDrafts.sort((a, b) => a.chapterNumber - b.chapterNumber);

            responseData.push({
                act,
                chapters: actChapters,
                drafts: actDrafts,
            })
        })

        return NextResponse.json({ responseData }, { status: 200 });
    } catch {
        return NextResponse.json({ error: 'Lỗi khi lấy dữ liệu' }, { status: 500 });
    }
}

export async function POST(req: NextRequest, context: { params: Promise<{ novelId: string }> }) {
    const { novelId } = await context.params;
    const currentUser = await getCurrentUser();

    try {
        await connectDB();

        const novel = await Novel.findById({ novelId });

        if (!novel) {
            return NextResponse.json({ error: 'Tiểu thuyết không tồn tại!' }, { status: 404 });
        }

        if (!currentUser) {
            return NextResponse.json({ error: 'Vui lòng đăng nhập!' }, { status: 401 });
        }

        if (novel.authorId.toString() !== currentUser._id) {
            return NextResponse.json({ error: 'Bạn không phải tác giả của tiểu thuyết này!' }, { status: 403 });
        }

        const body = await req.json();
        const { actId, title, content, chapterNumber, wordCount } = body;
        const act = await Act.findById({ _id: actId });

        if (!act) {
            return NextResponse.json({ error: 'Không tìm thấy Act/Hồi!' }, { status: 404 });
        }

        const draft = await Draft.create({
            title,
            content,
            chapterNumber,
            actId,
            novelId,
            wordCount
        });

        draft.save();

        return NextResponse.json({ draft }, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Lỗi khi lấy dữ liệu' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ novelId: string }> }) {
    const { novelId } = await context.params;
    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get('type') || 'published';

    const currentUser = await getCurrentUser();

    try {
        await connectDB();

        const novel = await Novel.findById({ _id: novelId }).select('authorId');

        if (!novel) {
            return NextResponse.json({ error: 'Tiểu thuyết không tồn tại!' }, { status: 404 });
        }

        if (!currentUser) {
            return NextResponse.json({ error: 'Vui lòng đăng nhập!' }, { status: 401 });
        }

        if (novel.authorId.toString() !== currentUser._id) {
            return NextResponse.json({ error: 'Bạn không phải tác giả của tiểu thuyết này!' }, { status: 403 });
        }

        const body = await req.json();
        const { actId, title, content, chapterNumber, wordCount } = body;

        const act = await Act.findById({ _id: actId });

        if (!act) {
            return NextResponse.json({ error: 'Không tìm thấy Act/Hồi!' }, { status: 404 });
        }

        if (type == 'published') {
            const chapter = await Chapter.create({
                title,
                content,
                chapterNumber,
                actId,
                novelId,
                wordCount
            });

            chapter.save();
        } else {
            const draft = await Draft.create({
                title,
                content,
                chapterNumber,
                actId,
                novelId,
                wordCount
            });

            draft.save();
        }

        return NextResponse.json({ success: true }, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Lỗi khi lấy dữ liệu' }, { status: 500 });

    }
}