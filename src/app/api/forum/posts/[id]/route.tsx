import { NextRequest, NextResponse } from 'next/server';
import { ForumPost } from '@/model/PostForum';
import { Comment } from '@/model/Comment';
import { connectDB } from '@/lib/db';
import optimizeComment from '@/utils/handleOptimize';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        connectDB();
        
        const { id: postId } = await context.params;

        console.log(ForumPost.modelName);
        console.log(Comment.modelName);

        const post = await ForumPost.findById(postId)
            .populate({
                path: 'userId',
                select: '_id username role profile.avatar'
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
                select: '_id username role profile.avatar'
            })
            .populate({
                path: 'replyToUserId',
                select: '_id username role'
            })
            .sort({ createdAt: -1 })
            .lean();

        const newComments = optimizeComment(comments);

        await ForumPost.findByIdAndUpdate(postId, { $inc: { views: 1 } });

        return NextResponse.json({
            post,
            comments: newComments
        });
        
    } catch (error) {
        console.error('Error fetching post:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}