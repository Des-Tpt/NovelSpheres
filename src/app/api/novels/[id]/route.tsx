import { connectDB } from "@/lib/db";
import { Act } from "@/model/Act";
import { Chapter } from "@/model/Chapter";
import { Comment } from "@/model/Comment";
import { Novel } from "@/model/Novel";
import optimizeComment from "@/utils/handleOptimize";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id: novelId } = await context.params;
    try {

        if (!novelId) {
            return NextResponse.json({ error: "NovelId là biến bắt buộc" }, { status: 400 });
        }

        await connectDB();

        console.log("modelName:", Novel.modelName);
        console.log("modelName:", Comment.modelName);

        const novel = await Novel.findById(novelId)
            .populate({ path: "authorId", select: "_id username profile role" })
            .populate({ path: "genresId", select: "_id name" })

        if (!novel) {
            return NextResponse.json({ error: "Không tìm thấy tiểu thuyết" }, { status: 404 });
        }

        const authorId = novel.authorId;
        const authorNovelCount = await Novel.countDocuments({ authorId: authorId });
        const chaptersCount = await Chapter.countDocuments({ novelId: novelId });

        const novelResponse = {
            ...novel.toObject(),
            authorNovelCount,
            chaptersCount
        };

        const comments = await Comment.find({ sourceType: "Novel", sourceId: novelId })
            .populate({ path: "userId", select: "_id username profile role" })
            .populate({ path: "replyToUserId", select: "_id username" })
            .sort({ createdAt: -1 })
            .lean();

        const optimizedComments = optimizeComment(comments);

        const acts = await Act.find({ novelId: novelId })
            .select("title actNumber publicId formatId")
            .sort({ actNumber: 1 })
            .lean();

        const actsWithChapters = await Promise.all(
            acts.map(async (act) => {
                const chapters = await Chapter.find({ actId: act._id })
                    .select("_id title chapterNumber wordCount updatedAt")
                    .sort({ name: 1 })
                    .lean();
                return { ...act, chapters };
            })
        );

        await Novel.findByIdAndUpdate(novelId, { $inc: { views: 1 } });

        return NextResponse.json({
            novel: novelResponse,
            comments: optimizedComments,
            acts: actsWithChapters,
        });
    } catch (error) {
        console.error("Error fetching novel:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}