import { Like } from "@/action/likeAction";
import { connectDB } from "@/lib/db";
import { pusherServer } from "@/lib/pusher-server";
import { Act } from "@/model/Act";
import { Chapter } from "@/model/Chapter";
import { Likes } from "@/model/Likes";
import { Notification } from "@/model/Notification";
import { Novel } from "@/model/Novel";
import removeScriptsFromHtml from "@/utils/removeScript";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string, actId: string }> }) {
    try {
        const { id: novelId, actId: actId } = await context.params;

        await connectDB();

        const { userId, title, content, chapterNumber, wordCount } = await request.json()

        const novel = await Novel.findById(novelId);

        if (!novel) {
            return NextResponse.json({ error: 'Novel không tồn tại!' }, { status: 404 });
        }

        if (userId !== novel.authorId.toString()) {
            return NextResponse.json({ error: 'Bạn không có quyền thực hiện thao tác này!' }, { status: 403 });
        }

        if (!title || !chapterNumber || !content) {
            return NextResponse.json({ error: 'Vui lòng nhập đầy đủ thông tin!' }, { status: 400 });
        }

        const act = await Act.findOne({ _id: actId, novelId: novelId });
        if (!act) {
            return NextResponse.json({ error: 'Act không tồn tại hoặc không thuộc về novel này!' }, { status: 404 });
        }

        const existingChapter = await Chapter.findOne({ actId: actId, chapterNumber: chapterNumber });

        if (existingChapter) {
            return NextResponse.json({
                error: `Chapter số ${chapterNumber} đã tồn tại trong Act này! Vui lòng chọn số thứ tự khác.`
            }, { status: 409 });
        }

        const cleanContent = removeScriptsFromHtml(content);

        const newChapter = new Chapter({
            novelId: novelId,
            actId: actId,
            content: cleanContent,
            title: title,
            chapterNumber: chapterNumber,
            wordCount: wordCount,
            createdAt: new Date(),
            updatedAt: new Date(),
        })

        const savedChapter = await newChapter.save();

        await Novel.findByIdAndUpdate(novelId, { updatedAt: new Date() });

        const likes = await Likes.find({ novelId })
            .select('userId')

        const notifPromises = likes.map(async (like) => {
            const message = `Tiểu thuyết ${novel.title} vừa có chương mới: ${title}`;
            const href = `/novels/${novelId.toString()}`;

            const notif = await Notification.create({
                userId: like.userId,
                type: 'chapter_update',
                message,
                href,
                createdAt: Date.now(),
            });

            await pusherServer.trigger(`private-user-${like.userId.toString()}`, "new-notification", {
                id: notif._id,
                message,
                href,
                createdAt: notif.createdAt
            });
        });

        await Promise.all(notifPromises);

        // Trả về chapter data để frontend update cache
        return NextResponse.json({
            success: true,
            message: 'Tạo chapter thành công!',
            data: {
                _id: savedChapter._id.toString(),
                title: savedChapter.title,
                chapterNumber: savedChapter.chapterNumber,
                wordCount: savedChapter.wordCount,
                actId: savedChapter.actId.toString(),
                createdAt: savedChapter.createdAt.toISOString(),
                updatedAt: savedChapter.updatedAt.toISOString()
            }
        }, { status: 201 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string, actId: string }> }) {
    try {
        const { id: novelId, actId: actId } = await context.params;

        await connectDB();

        const { userId, chapterId, title, content, chapterNumber, wordCount } = await request.json();

        // Kiểm tra novel có tồn tại không
        const novel = await Novel.findById(novelId);
        if (!novel) {
            return NextResponse.json({ error: 'Novel không tồn tại!' }, { status: 404 });
        }

        // Kiểm tra quyền tác giả
        if (userId !== novel.authorId.toString()) {
            return NextResponse.json({ error: 'Bạn không có quyền thực hiện thao tác này!' }, { status: 403 });
        }

        // Validate input - chỉ yêu cầu chapterId, title, chapterNumber
        if (!chapterId || !title || !chapterNumber) {
            return NextResponse.json({ error: 'Vui lòng nhập đầy đủ thông tin!' }, { status: 400 });
        }

        // Kiểm tra act có tồn tại không
        const act = await Act.findOne({ _id: actId, novelId: novelId });
        if (!act) {
            return NextResponse.json({ error: 'Act không tồn tại hoặc không thuộc về novel này!' }, { status: 404 });
        }

        // Tìm chapter cần update
        const existingChapter = await Chapter.findOne({
            _id: chapterId,
            actId: actId,
            novelId: novelId
        });

        if (!existingChapter) {
            return NextResponse.json({ error: 'Chapter không tồn tại!' }, { status: 404 });
        }

        // Kiểm tra chapterNumber có trung với chapter khác không (trừ chính nó)
        const duplicateChapter = await Chapter.findOne({
            actId: actId,
            chapterNumber: chapterNumber,
            _id: { $ne: chapterId }
        });

        if (duplicateChapter) {
            return NextResponse.json({
                error: `Chapter số ${chapterNumber} đã tồn tại trong Act này! Vui lòng chọn số thứ tự khác.`
            }, { status: 409 });
        }

        const cleanContent = removeScriptsFromHtml(content);

        const updateData = {
            title: title,
            chapterNumber: chapterNumber,
            updatedAt: new Date(),
            ...(cleanContent && cleanContent.trim() && {
                content: cleanContent,
                wordCount: wordCount || 0
            })
        };

        // Update chapter với conditional data
        const updatedChapter = await Chapter.findByIdAndUpdate(
            chapterId,
            updateData,
            { new: true }
        );

        if (!updatedChapter) {
            return NextResponse.json({ error: 'Không thể cập nhật chapter!' }, { status: 500 });
        }

        await Novel.findByIdAndUpdate(novelId, { updatedAt: new Date() });

        return NextResponse.json({
            success: true,
            message: `Cập nhật thành công!`,
            data: {
                _id: updatedChapter._id,
                title: updatedChapter.title,
                chapterNumber: updatedChapter.chapterNumber,
                wordCount: updatedChapter.wordCount,
                updatedAt: updatedChapter.updatedAt,
                actId: updatedChapter.actId
            }
        }, { status: 200 });

    } catch (error) {
        console.error('Lỗi khi cập nhật chapter:', error);
        return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string, actId: string }> }) {
    try {

        const { id: novelId, actId: actId } = await context.params;

        await connectDB();

        const novel = await Novel.findById(novelId);
        if (!novel) {
            return NextResponse.json({ error: 'Novel không tồn tại!' }, { status: 404 });
        }

        const formData = await request.formData();
        const userId = formData.get('userId') as string;
        const chapterId = formData.get('chapterId') as string;

        if (userId.toString() !== novel.authorId.toString()) {
            return NextResponse.json({ error: 'Bạn không có quyền thực hiện thao tác này!' }, { status: 403 });
        }

        const act = await Act.findById(actId);
        if (!act) {
            return NextResponse.json({ error: 'Act không tồn tại!' }, { status: 404 });
        }

        await Chapter.findByIdAndDelete(chapterId);

        return NextResponse.json({ success: true, chapterId: chapterId, actId: actId, }, { status: 200 });
    } catch (error) {
        console.error('Lỗi xóa act:', error);
        return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
    }
}
