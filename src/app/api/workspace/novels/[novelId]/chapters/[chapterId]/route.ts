import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Chapter } from "@/model/Chapter";
import { NextRequest, NextResponse } from "next/server";

export default async function GET(request: NextRequest, context: { params: Promise<{ chapterId: string }> }) {
    const params = await context.params;
    const chapterId = params.chapterId;

    const currentUser = await getCurrentUser();

    if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        await connectDB();

        const chapter = await Chapter.findById(chapterId);
        if (!chapter) return NextResponse.json({ error: 'Không tìm thấy!' }, { status: 404 });

        return NextResponse.json({ chapter }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: 'Lỗi khi lấy dữ liệu' }, { status: 500 });
    }
}