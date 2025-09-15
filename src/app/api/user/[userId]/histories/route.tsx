import { connectDB } from "@/lib/db";
import { Chapter } from "@/model/Chapter";
import { Genre } from "@/model/Genre";
import { History } from "@/model/History";
import { Novel } from "@/model/Novel";
import { User } from "@/model/User";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, context : { params: Promise<{ userId: string }> }) {
    try {
        await connectDB();

        const { searchParams } = request.nextUrl;
        const userId = await context.params;
        const page = parseInt(searchParams.get("page") || "1");
        const limit = 10;

        if (!userId) {
            return NextResponse.json(
                { error: "Không lấy được thông tin người dùng!" },
                { status: 400 }
            );
        }

        const skip = (page - 1) * limit;

        const total = await History.countDocuments({ userId });

        const histories = await History.find({ userId })
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate({
                path: 'novelId',
                select: 'title coverImage status genresId',
                model: Novel,
                populate: {
                    path: 'genresId',
                    select: 'name _id',
                    model: Genre
                }
            })
            .populate({
                path: 'userId',
                select: 'username',
                model: User
            })
            .populate({
                path: 'chapterId',
                select: 'title chapterNumber',
                model: Chapter
            })
            .lean();

        const formattedHistories = histories.map(history => ({
            _id: history._id,
            novels: {
                _id: history.novelId._id,
                title: history.novelId.title,
                coverImage: history.novelId.coverImage,
                status: history.novelId.status,
                genres: history.novelId.genresId.map((g: any) => ({
                    id: g._id,
                    name: g.name
                }))
            },
            chapter: {
                _id: history.chapterId._id,
                number: history.chapterId.chapterNumber,
                title: history.chapterId.title
            },
            currentChapter: history.currentChapter,
            lastReadAt: history.lastReadAt,
        }));

        return NextResponse.json({
            histories: formattedHistories,
            pagination: {
                total,
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                hasMore: skip + histories.length < total
            }
        });

    } catch (error) {
        return NextResponse.json(
            { error: "Lỗi khi lấy lịch sử đọc!" },
            { status: 500 }
        );
    }
}