import { connectDB } from "@/lib/db";
import { Likes } from "@/model/Likes";
import { Novel } from "@/model/Novel";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const { id: novelId } = await context.params;
        const { searchParams } = new URL(request.url);

        const userId = searchParams.get('userId');

        await connectDB();

        const novel = await Novel.findById(novelId);
        if (!novel) return NextResponse.json({ error: 'Không tim thấy tiểu thuyết!' }, { status: 404 })

        const existingLike = await Likes.findOne({ userId, novelId });

        if (existingLike) {
            return NextResponse.json({ liked: true });
        } else {
            return NextResponse.json({ liked: false });
        }
    } catch {
        return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
    }
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const { id: novelId } = await context.params;
        const { userId } = await request.json();

        await connectDB();

        const novel = await Novel.findById(novelId);
        if (!novel) return NextResponse.json({ error: 'Không tim thấy tiểu thuyết!' }, { status: 404 })

        if (userId == novel.authorId.toString()) {
            return NextResponse.json({ error: 'Bạn không thể follow tác phẩm của chính mình!' }, { status: 403 });
        }

        const newLike = new Likes({
            userId: userId,
            novelId: novelId,
        })
        await newLike.save();

        return NextResponse.json({ message: 'Like thành công' }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const { id: novelId } = await context.params;
        const { userId } = await request.json();

        await connectDB();

        const novel = await Novel.findById(novelId);
        if (!novel) return NextResponse.json({ error: 'Không tim thấy tiểu thuyết!' }, { status: 404 })

        if (userId == novel.authorId.toString()) {
            return NextResponse.json({ error: 'Bạn không thể follow tác phẩm của chính mình!' }, { status: 403 });
        }

        const deletedLike = await Likes.findOneAndDelete({ userId, novelId });

        if (!deletedLike) {
            return NextResponse.json({ error: 'Không tìm thấy like để xóa' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Unlike thành công' }, { status: 200 });
    } catch {
        return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
    }
}