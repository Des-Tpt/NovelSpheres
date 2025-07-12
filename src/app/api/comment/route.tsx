import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Comment } from '@/model/Comment';
import { ForumPost } from '@/model/PostForum';
import { getCurrentUser } from '@/lib/auth';
import { Novel } from '@/model/Novel';
import { error } from 'console';
import { Chapter } from '@/model/Chapter';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập!' }, { status: 401 });
    }

    const { sourceId, content, sourceType, parentId, replyToUserId } = await request.json();

    if (!sourceId || !content || !sourceType) {
      return NextResponse.json({ error: 'Thiếu trường dữ liệu comment' }, { status: 400 });
    }

    if (content.trim().length === 0) {
      return NextResponse.json({ error: 'Nội dung comment không được trống' }, { status: 400 });
    }

    await connectDB();

    //Kiểm tra xem sourceType có tồn tại hay không
    if (sourceType === 'ForumPost'){
      const post = await ForumPost.findById(sourceId);
      if (!post) 
        {
          return NextResponse.json({ error: 'Không tìm thấy bài đăng' }, { status: 404 });
        }
    } 
    else if (sourceType === 'Novel') {
      const novel = await Novel.findById(sourceId);
      if (!novel)
        { 
          return NextResponse.json({ error: 'Không tìm thấy tiểu thuyết'}, { status: 404 });
        }
    }
    else if (sourceType === 'NovelChapter'){
      const chapter = await Chapter.findById(sourceId);
      if (!chapter) 
        {
          return NextResponse.json({ error: 'Không tìm thấy chương'}, { status: 404 });
        }
    }

    if (parentId) {
      const parentComment = await Comment.findById(parentId);
      if (!parentComment) {
        return NextResponse.json({ error: 'Không tìm thấy comment gốc' }, { status: 404 });
      }
    }

    // Tạo comment mới
    const newComment = new Comment({
      userId: user.userId,
      parentId: parentId || null,
      replyToUserId: replyToUserId || null,
      sourceType,
      sourceId,
      content,
      createdAt: new Date(),
    });

    await newComment.save();
    
    await newComment.populate('userId', 'username role profile');
    if (replyToUserId) {
      await newComment.populate('replyToUserId', 'username _id');
    }


    return NextResponse.json({ 
      success: true, 
      comment: newComment 
    }, { status: 201 });

  } catch (error) {
    console.error('Lỗi khi tạo comment:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
