import { updateChapter } from "@/action/chapterActions";
import { connectDB } from "@/lib/db";
import { Chapter } from "@/model/Chapter";
import { Genre } from "@/model/Genre";
import { Likes } from "@/model/Likes";
import { Novel } from "@/model/Novel";
import { User } from "@/model/User";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, context: { params: Promise<{ userId: string }> }) {
    try {
        await connectDB();
        const { searchParams } = request.nextUrl;
        const { userId } = await context.params;
        const page = parseInt(searchParams.get("page") || "1");
        const limit = 10;

        if (!userId) {
            return NextResponse.json(
                { error: "Không lấy được thông tin người dùng!" },
                { status: 400 }
            );
        }
        const skip = (page - 1) * limit;

        const total = await Likes.countDocuments({ userId });

        const favorites = await Likes.find({ userId })
            .sort({ updatedDate: -1 })
            .skip(skip)
            .populate({
                path: 'novelId',
                select: '_id title coverImage description status genresId',
                model: Novel,
                populate: [
                    {
                        path: 'genresId',
                        select: 'name _id',
                        model: Genre,
                    },
                    {
                        path: '_id',
                        model: Chapter,
                        options: {
                            sort: { updatedAt: -1 },
                            limit: 1,
                        },
                        select: '_id chapterNumber title',
                    },
                ]
            })
            .populate({
                path: 'userId',
                select: 'username',
                model: User,
            })
            .lean();

        const formattedFavorites = favorites.map(f => ({
            _id: f._id,
            novels: {
                _id: f.novelId._id,
                title: f.novelId.title,
                coverImage: f.novelId.coverImage,
                status: f.novelId.status,
                genres: f.novelId.genresId.map((g: any) => ({
                    id: g._id,
                    name: g.name
                }))
            },
            chapter: {
                _id: f.chapterId._id._id,
                chapterNumber: f.chapterId._id.chapterNumber,
                title: f.chapterId._id.title,
            }
        }))

        return NextResponse.json({
            favorites: formattedFavorites,
            pagination: {
                total,
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                hasMore: skip + favorites.length < total
            }
        });
    } catch {
        return NextResponse.json(
            { error: "Lỗi khi lấy danh sách yêu thích!" },
            { status: 500 }
        );
    }
}