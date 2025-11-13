import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Comment } from "@/model/Comment";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();

        const { id: id } = await context.params;

        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        await connectDB();
        const comment = await Comment.findById(id);

        if (!comment) {
            return NextResponse.json(
                { error: "Comment not found" },
                { status: 404 }
            );
        }

        const userId = user._id.toString();

        if (!comment.likes || !comment.likes.userIds) {
            comment.likes = { count: 0, userIds: [] };
        }

        const userIdIndex = comment.likes.userIds.findIndex(
            (id: any) => id.toString() === userId
        );

        if (userIdIndex === -1) {
            // Like
            comment.likes.userIds.push(userId);
            comment.likes.count++;
        } else {
            // Unlike
            comment.likes.userIds.splice(userIdIndex, 1);
            comment.likes.count--;
        }

        await comment.save();

        return NextResponse.json({
            success: true,
            likes: {
                count: comment.likes.count,
                hasLiked: comment.likes.userIds.some(
                    (id: any) => id.toString() === userId
                )
            }
        });
    } catch (error) {
        console.error("Error toggling like:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}