import { connectDB } from "@/lib/db";
import { Genre } from "@/model/Genre";
import { Novel } from "@/model/Novel";
import { User } from '@/model/User';
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        await connectDB();

        const formData = await req.formData();
        const page = parseInt(formData.get("page") as string || "1");
        const genreId: string[] = formData.getAll("genreId") as string[];
        const limit = 16;
        const sort = formData.get('sort') as string || 'date';

        const skip = (page - 1) * limit;

        const sortOptions: Record<string, any> = {
            title: { title: 1 },
            date: { updatedAt: -1 },
            views: { views: -1 },
        };

        const sortBy = sortOptions[sort] || { updatedAt: -1 };

        // Tạo điều kiện query cho Novel
        const query: any = {};
        if (genreId && genreId.length > 0) {
            query.genresId = { $all: genreId };
        }

        const total = await Novel.countDocuments(query);

        const novel = await Novel.find(query)
            .sort(sortBy)
            .skip(skip)
            .limit(limit)
            .populate({
                path: 'authorId',
                select: 'username profile.avatar role',
                model: User,
            })
            .populate({
                path: 'genresId',
                select: 'name',
                model: Genre,
            })
            .lean();

        return NextResponse.json({
            novel,
            hasMore: skip + novel.length < total,
        });

    } catch (e) {
        console.log(e);
        return NextResponse.json({ e: "Lỗi khi lấy dữ liệu" });
    }
}
