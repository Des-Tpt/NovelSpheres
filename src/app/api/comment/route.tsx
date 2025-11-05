import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Comment } from '@/model/Comment';
import { ForumPost } from '@/model/PostForum';
import { getCurrentUser } from '@/lib/auth';
import { Novel } from '@/model/Novel';
import { Chapter } from '@/model/Chapter';
import { Notification } from '@/model/Notification';
import { pusherServer } from '@/lib/pusher-server';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập để bình luận!' }, { status: 401 });
    }

    const { sourceId, content, sourceType, parentId, replyToUserId } = await request.json();

    if (!sourceId || !content || !sourceType) {
      return NextResponse.json({ error: 'Thiếu trường dữ liệu comment' }, { status: 400 });
    }

    if (content.trim().length === 0) {
      return NextResponse.json({ error: 'Nội dung comment không được trống' }, { status: 400 });
    }

    await connectDB();

    // Kiểm tra xem sourceType có tồn tại hay không
    let sourceTitle = '';
    if (sourceType === 'ForumPost') {
      const post = await ForumPost.findById(sourceId);
      if (!post) {
        return NextResponse.json({ error: 'Không tìm thấy bài đăng' }, { status: 404 });
      }
      sourceTitle = post.title;
    }
    else if (sourceType === 'Novel') {
      const novel = await Novel.findById(sourceId);
      if (!novel) {
        return NextResponse.json({ error: 'Không tìm thấy tiểu thuyết' }, { status: 404 });
      }
      sourceTitle = novel.title;
    }
    else if (sourceType === 'NovelChapter') {
      const chapter = await Chapter.findById(sourceId).populate('novelId', 'title');
      if (!chapter) {
        return NextResponse.json({ error: 'Không tìm thấy chương' }, { status: 404 });
      }
      sourceTitle = `${chapter.novelId.title} - ${chapter.title}`;
    }

    let parentComment = null;
    if (parentId) {
      parentComment = await Comment.findById(parentId).populate('userId', 'username _id');
      if (!parentComment) {
        return NextResponse.json({ error: 'Không tìm thấy comment gốc' }, { status: 404 });
      }
    }

    // Tạo comment mới
    const newComment = new Comment({
      userId: user._id,
      parentId: parentId || null,
      replyToUserId: replyToUserId || null,
      sourceType: sourceType,
      sourceId: sourceId,
      content: content,
      likes: {
        count: 0,
        userIds: [],
      },
      createdAt: new Date(),
    });

    await newComment.save();

    await newComment.populate('userId', '_id username role profile');
    if (replyToUserId) {
      await newComment.populate('replyToUserId', 'username _id');
    }

    if (replyToUserId && replyToUserId.toString() !== user._id.toString()) {
      try {
        let message, href;

        if (sourceType === 'ForumPost') {
          message = `${user.username} đã trả lời bình luận của bạn trong "${sourceTitle}"`;
          href = `/forum/post/${sourceId.toString()}`;
        } else if (sourceType === 'Novel') {
          message = `${user.username} đã trả lời bình luận của bạn trong tiểu thuyết "${sourceTitle}"`;
          href = `/novels/${sourceId.toString()}`;
        } else if (sourceType === 'NovelChapter') {
          message = `${user.username} đã trả lời bình luận của bạn trong "${sourceTitle}"`;
          href = `/chapter/${sourceId.toString()}`;
        }

        // 1. Lưu vào DB
        const notif = await Notification.create({
          userId: replyToUserId,
          type: 'comment_reply',
          message,
          href,
          createdAt: Date.now(),
        });

        // 2. Bắn realtime qua Pusher
        await pusherServer.trigger(`private-user-${replyToUserId.toString()}`, "new-notification", {
          id: notif._id,
          message,
          href,
          createdAt: notif.createdAt
        });

      } catch (notificationError) {
        console.error('Lỗi khi gửi notification:', notificationError);
      }
    }

    const commentResponse = {
      ...newComment.toObject(),
      replies: [],
    };

    return NextResponse.json({
      success: true,
      comment: commentResponse
    }, { status: 201 });

  } catch (error) {
    console.error('Lỗi khi tạo comment:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}