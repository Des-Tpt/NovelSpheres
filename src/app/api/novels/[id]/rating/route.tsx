import { connectDB } from "@/lib/db";
import { Likes } from "@/model/Likes";
import { Novel } from "@/model/Novel";
import { Rating } from "@/model/Rating";
import { modelNames } from "mongoose";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {

        console.log(modelNames, Rating);

        const { id: novelId } = await context.params;
        const { searchParams } = new URL(request.url);

        const userId = searchParams.get('userId');

        await connectDB();

        const novel = await Novel.findById(novelId);
        if (!novel) return NextResponse.json({ error: 'Không tim thấy tiểu thuyết!' }, { status: 404 })

        const ratings = await Rating.findOne({ userId, novelId });

        if (ratings) {
            return NextResponse.json({ rated: true, ratings });
        } else {
            return NextResponse.json({ rated: false });
        }
    } catch {
        return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
    }
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const { id: novelId } = await context.params;
        const { userId, score } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: 'Thiếu thông tin người dùng' }, { status: 400 });
        }

        await connectDB();

        const novel = await Novel.findById(novelId);
        if (!novel) return NextResponse.json({ error: 'Không tim thấy tiểu thuyết!' }, { status: 404 })

        if (userId == novel.authorId) {
            return NextResponse.json({ error: 'Bạn không thể đánh giá tác phẩm của chính mình!' }, { status: 403 });
        }

        if (!score || score < 1 || score > 5) {
            return NextResponse.json({ error: 'Điểm đánh giá phải từ 1 đến 5' }, { status: 400 });
        }

        const newRate = new Rating({
            userId: userId,
            novelId: novelId,
            score: score,
        })
        await newRate.save();

        return NextResponse.json({ message: 'Rate thành công' }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const { id: novelId } = await context.params;
        const { userId, score } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: 'Thiếu thông tin người dùng' }, { status: 400 });
        }

        if (!score || score < 1 || score > 5) {
            return NextResponse.json({ error: 'Điểm đánh giá phải từ 1 đến 5' }, { status: 400 });
        }

        await connectDB();

        const novel = await Novel.findById(novelId);
        if (!novel) {
            return NextResponse.json({ error: 'Không tìm thấy tiểu thuyết!' }, { status: 404 });
        }

        if (userId === novel.authorId) {
            return NextResponse.json({ error: 'Bạn không thể đánh giá tác phẩm của chính mình!' }, { status: 403 });
        }

        // Check existing rating với ObjectId
        const existingRating = await Rating.findOne({
            userId: userId,
            novelId: novelId
        });

        if (!existingRating) {
            return NextResponse.json({ error: 'Không tìm thấy đánh giá để sửa' }, { status: 404 });
        }

        const updatedRating = await Rating.findOneAndUpdate(
            { userId: userId, novelId: novelId },
            { score: score },
            { new: true }
        );

        return NextResponse.json({
            message: 'Cập nhật đánh giá thành công',
            rating: updatedRating
        }, { status: 200 });

    } catch (error) {
        console.error('Error updating rating:', error);
        return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
    }
}