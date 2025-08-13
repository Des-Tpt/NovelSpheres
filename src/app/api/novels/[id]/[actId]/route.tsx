import { connectDB } from "@/lib/db";
import { Act } from "@/model/Act";
import { Chapter } from "@/model/Chapter";
import { Novel } from "@/model/Novel";
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

        const newChapter = new Chapter({
            novelId: novelId,
            actId: actId,
            content: content,
            title: title,
            chapterNumber: chapterNumber,
            wordCount: wordCount,
            createdAt: new Date(),
            updatedAt: new Date(),
        })
        await newChapter.save();

        await Novel.findByIdAndUpdate(novelId, { updatedAt: new Date() });
        return NextResponse.json({ success: true, }, { status: 201 });

    } catch (error) {
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

        const updateData = {
            title: title,
            chapterNumber: chapterNumber,
            updatedAt: new Date(),
            ...(content && content.trim() && {
                content: content,
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

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error('Lỗi xóa act:', error);
        return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
    }
}
