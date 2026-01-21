import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Novel } from "@/model/Novel";
import { Chapter } from "@/model/Chapter";
import { Draft } from "@/model/Draft";
import { Comment } from "@/model/Comment";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, context: { params: Promise<{ userId: string }> }) {
    const params = await context.params;
    const userId = params.userId;

    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get('page') || 1;
    const limit = 10;
    const skip = (Number(page) - 1) * Number(limit);

    const currentUser = await getCurrentUser();

    if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (currentUser._id != userId) return NextResponse.json({ error: 'Bạn không được phép truy cập vào workspace này!' }, { status: 403 });

    try {
        await connectDB();

        const novels = await Novel.find({ authorId: userId })
            .populate('genresId', 'name')
            .skip(skip)
            .limit(Number(limit))
            .sort({ updatedAt: -1 });

        const detailedNovels = await Promise.all(novels.map(async (novel) => {
            const [publishedCount, draftCount, wordCountAgg, commentCount] = await Promise.all([
                Chapter.countDocuments({ novelId: novel._id }),
                Draft.countDocuments({ novelId: novel._id }),
                Chapter.aggregate([
                    { $match: { novelId: novel._id } },
                    { $group: { _id: null, totalWords: { $sum: "$wordCount" } } }
                ]),
                Comment.countDocuments({ sourceId: novel._id, sourceType: 'Novel' })
            ]);

            const totalWords = wordCountAgg.length > 0 ? wordCountAgg[0].totalWords : 0;

            return {
                ...novel.toObject(),
                stats: {
                    published: publishedCount,
                    drafts: draftCount,
                    words: totalWords,
                    views: novel.views || 0,
                    likes: novel.likes || 0,
                    comments: commentCount,
                }
            };
        }));

        const hasMore = await Novel.countDocuments({ authorId: userId }) > Number(page) * Number(limit);

        return NextResponse.json({ novels: detailedNovels, hasMore }, { status: 200 });
    } catch (error) {
        console.log("Workspace API Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}