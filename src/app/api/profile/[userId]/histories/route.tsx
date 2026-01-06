import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { History } from "@/model/History";
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

        const currentUser = await getCurrentUser();

        if (currentUser && userId !== currentUser._id) {
            return NextResponse.json(
                { error: "Bạn không có quyền xem lịch sử của người khác!" },
                { status: 400 }
            );
        }

        // Lấy tất cả novels của user, sắp xếp theo updatedAt
        const allNovels = await History.find({ userId })
            .distinct("novelId")
            .lean<any>();

        // Lấy history mới nhất của mỗi novel
        const historyPromises = allNovels.map((novelId: string) =>
            History.findOne({ userId, novelId })
                .sort({ lastReadAt: -1 })
                .populate({
                    path: 'novelId',
                    select: 'title coverImage status genresId',
                    populate: {
                        path: 'genresId',
                        select: 'name _id',
                    }
                })
                .populate({
                    path: 'chapterId',
                    select: 'title chapterNumber',
                })
                .lean()
        );

        const histories = await Promise.all(historyPromises);

        const validHistories = histories.filter(history =>
            history && history.novelId && history.chapterId
        );

        validHistories.sort((a, b) =>
            new Date(b.lastReadAt).getTime() - new Date(a.lastReadAt).getTime()
        );

        // Pagination
        const skip = (page - 1) * limit;
        const total = validHistories.length;
        const paginatedHistories = validHistories.slice(skip, skip + limit);

        const formattedHistories = paginatedHistories.map(history => ({
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
                chapterNumber: history.chapterId.chapterNumber,
                title: history.chapterId.title
            },
            lastReadAt: history.lastReadAt,
        }));

        return NextResponse.json({
            histories: formattedHistories,
            pagination: {
                total,
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                hasMore: skip + paginatedHistories.length < total
            }
        });

    } catch (error) {
        console.log(error);
        return NextResponse.json(
            { error: "Lỗi khi lấy lịch sử đọc!" },
            { status: 500 }
        );
    }
}