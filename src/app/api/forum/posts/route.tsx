import { NextRequest, NextResponse } from 'next/server';
import { ForumPost } from '@/model/PostForum';
import { connectDB } from '@/lib/db';
import { User } from '@/model/User';
import { Comment } from '@/model/Comment';
import { getCurrentUser } from '@/lib/auth';
import removeScriptsFromHtml from '@/utils/removeScript';

export async function GET(req: NextRequest) {
    await connectDB();
    const { searchParams } = req.nextUrl;

    const page = parseInt(searchParams.get('page') || '1');
    const category = searchParams.get('category');
    const sort = searchParams.get('sort') || 'date';
    const limit = parseInt(searchParams.get('limit') || '10');

    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (category) filter.category = category;

    const sortOptions: Record<string, any> = {
        title: { title: 1 },
        date: { lastCommentAt: -1 },
        views: { views: -1 },
    };

    const sortBy = sortOptions[sort] || { createdAt: -1 };

    try {
        const total = await ForumPost.countDocuments(filter);

        const posts = await ForumPost.find(filter)
            .sort(sortBy)
            .skip(skip)
            .limit(limit)
            .populate({
                path: 'userId',
                select: 'username profile.avatar role',
                model: User,
            })
            .lean();

        const formatted = await Promise.all(
            posts.map(async (post) => {
                const totalReplies = await Comment.countDocuments({ sourceId: post._id });

                return {
                    _id: post._id,
                    title: post.title,
                    content: post.content,
                    category: post.category,
                    createdAt: post.createdAt,
                    updatedAt: post.updatedAt,
                    views: post.views,
                    isLocked: post.isLocked,
                    novelId: post.novelId,
                    role: post.userId?.role || 'Không rõ',
                    owner: post.userId?.username || 'Vô danh',
                    avatar: post.userId?.profile?.avatar || null,
                    totalRepiles: totalReplies,
                    lastCommentAt: post.lastCommentAt,
                }
            })
        )

        return NextResponse.json({
            data: formatted,
            page,
            total,
            hasMore: skip + posts.length < total,
        });
    } catch (e) {
        console.error('[ForumPosts API ERROR]', e);
        return NextResponse.json(
            { error: 'Không thể lấy thông tin bài viết.' },
            { status: 500 }
        );
    }
}

type User = {
    _id: string;
    username: string;
    email: string;
    publicId: string;
    format: string;
    role: string;
}

export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const user: User | null = await getCurrentUser();

        if (!user) return NextResponse.json({ error: 'Vui lòng đăng nhập tài khoản để tạo post!' }, { status: 401 });

        const { title, category, content, novelId } = await request.json();

        const safeContent = removeScriptsFromHtml(content);

        const newPost = new ForumPost({
            userId: user._id,
            novelId: novelId ?? null,
            title: title,
            category: category,
            content: safeContent,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        await newPost.save();

        return NextResponse.json({ success: true, post: newPost })
    } catch (e) {
        return NextResponse.json({ error: 'Đã xảy ra lỗi khi tạo post!' }, { status: 500 });
    }
}