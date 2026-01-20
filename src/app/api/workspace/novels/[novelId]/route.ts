import { getCurrentUser } from "@/lib/auth";
import { Act } from "@/model/Act";
import { Chapter } from "@/model/Chapter";
import { Draft } from "@/model/Draft";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, context: { params: Promise<{ novelId: string }> }) {
    const params = await context.params;
    const novelId = params.novelId;

    const currentUser = await getCurrentUser();

    if (!currentUser) return NextResponse.json({ error: 'Lỗi xác thực, vui lòng đăng nhập lại!' }, { status: 401 });

    const acts = await Act.find({ novelId });
    const chapters = await Chapter.find({ novelId })
        .select('_id title actId chapterNumber wordCount');
    const drafts = await Draft.find({ novelId })
        .select('_id title actId chapterNumber wordCount');

    if (!acts || !chapters || !drafts) return NextResponse.json({ error: 'Không tìm thấy!' }, { status: 404 });

    const responseData: any[] = [];

    acts.forEach(act => {
        responseData.push({
            act,
            chapters: chapters.filter(chapter => chapter.actId.toString() === act._id.toString()),
            drafts: drafts.filter(draft => draft.actId.toString() === act._id.toString()),
        })
    })

    return NextResponse.json({ responseData }, { status: 200 });
}