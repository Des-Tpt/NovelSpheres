import { connectDB } from "@/lib/db";
import { Novel } from "@/model/Novel";
import { Rating } from "@/model/Rating";
import { modelNames } from "mongoose";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {

        console.log(modelNames, Rating);
        const { searchParams } = new URL(request.url);

        const { id: novelId } = await context.params;
        const limit = 10;
        const page = Number(searchParams.get("page") ?? 1);
        const skip = (page - 1) * limit;

        await connectDB();

        const novel = await Novel.findById(novelId);
        if (!novel) return NextResponse.json({ error: 'Không tim thấy tiểu thuyết!' }, { status: 404 })

        const ratings = await Rating.find(novel._id)
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })
            .select('_id userId score rate likes createdAt')
            .populate('userId', '_id username role')

        const total = await Rating.countDocuments();

        return NextResponse.json({
            ratings,
            hasMore: total > page * limit,
        });
    } catch {
        return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
    }
}
