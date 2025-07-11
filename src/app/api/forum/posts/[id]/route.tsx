import { NextRequest, NextResponse } from 'next/server';
import { ForumPost } from '@/model/PostForum';
import { Comment } from '@/model/Comment';
import { connectDB } from '@/lib/db';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        connectDB();
        
        const { id: postId } = await context.params;

        console.log(ForumPost.modelName);
        console.log(Comment.modelName);

        const post = await ForumPost.findById(postId)
            .populate({
                path: 'userId',
                select: 'username role profile.avatar'
            })
            .populate({
                path: 'novelId',
                select: 'title'
            })
            .lean();

        if (!post) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        const comments = await Comment.find({
            sourceType: 'ForumPost',
            sourceId: postId
        })
        .populate({
            path: 'userId',
            select: 'username role profile.avatar'
        })
        .populate({
            path: 'replyToUserId',
            select: 'username role'
        })
        .sort({ createdAt: 1 })
        .lean();

        const organizedComments = organizeComments(comments);

        await ForumPost.findByIdAndUpdate(postId, { $inc: { views: 1 } });

        return NextResponse.json({
            post,
            comments: organizedComments
        });
    } catch (error) {
        console.error('Error fetching post:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

function organizeComments(comments: any[]) {
    const commentMap = new Map();
    const rootComments: any[] = [];

    comments.forEach(comment => {
        commentMap.set(comment._id.toString(), { ...comment, replies: [] });
    });

    comments.forEach(comment => {
        if (comment.parentId) {
            const parent = commentMap.get(comment.parentId.toString());
            if (parent) {
                parent.replies.push(commentMap.get(comment._id.toString()));
            }
        } else {
            rootComments.push(commentMap.get(comment._id.toString()));
        }
    });

    return rootComments;
}