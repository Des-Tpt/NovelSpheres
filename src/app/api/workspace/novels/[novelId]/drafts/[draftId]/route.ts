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

        const draft = await Draft.findById(draftId);
        if (!draft) return NextResponse.json({ error: 'Không tìm thấy!' }, { status: 404 });

        return NextResponse.json({ draft }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: 'Lỗi khi lấy dữ liệu' }, { status: 500 });
    }
}