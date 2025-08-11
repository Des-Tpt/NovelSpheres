import cloudinary from "@/lib/cloudinary";
import { connectDB } from "@/lib/db";
import { Act } from "@/model/Act";
import { Chapter } from "@/model/Chapter";
import { Comment } from "@/model/Comment";
import { Genre } from "@/model/Genre";
import { Novel } from "@/model/Novel";
import { User } from "@/model/User";
import optimizeComment from "@/utils/handleOptimize";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id: novelId } = await context.params;
    try {
        if (!novelId) {
            return NextResponse.json({ error: "NovelId là biến bắt buộc" }, { status: 400 });
        }

        await connectDB();

        console.log(Novel.modelName);
        console.log(Comment.modelName);
        console.log(Genre.modelName);
        console.log(User.modelName);

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
            .select("title actNumber actType publicId formatId")
            .sort({ actNumber: 1 })
            .lean();

        const actsWithChapters = await Promise.all(
            acts.map(async (act) => {
                const chapters = await Chapter.find({ actId: act._id })
                    .select("_id title chapterNumber wordCount updatedAt")
                    .sort({ chapterNumber: 1 })
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

interface CloudinaryUploadResult {
    public_id: string;
    format: string;
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const { id: novelId } = await context.params;

        await connectDB();

        const novel = await Novel.findById(novelId);

        if (!novel) {
            return NextResponse.json({ error: 'Novel không tồn tại!' }, { status: 404 });
        }

        const formData = await request.formData();
        const userId = formData.get('userId') as string;
        const title = formData.get('title') as string;
        const actNumberStr = formData.get('actNumber') as string;
        const actType = formData.get('actType') as string;
        const file = formData.get('file') as File | null;
        const actNumber = parseInt(actNumberStr, 10);

        if (userId.toString() !== novel.authorId.toString()) {
            return NextResponse.json({ error: 'Bạn không có quyền thực hiện thao tác này!' }, { status: 403 });
        }

        if (!title || !actNumber) {
            return NextResponse.json({ error: 'Vui lòng nhập đầy đủ thông tin!' }, { status: 400 });
        }

        let publicId: string | null = null;
        let format: string | null = null;

        // Chỉ upload lên cloundinary nếu file tồn tại.
        if (file) {

            // Chuyển file thành dạng Web Api, sau đó chuyển qua dạng Buffer để gửi vào stream của Cloundinary
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const uploadResult = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
                cloudinary.uploader
                    .upload_stream(
                        { resource_type: 'auto', folder: 'LightNovel/BookCover' },
                        (err, result) => {
                            if (err) reject(err);
                            else resolve(result as CloudinaryUploadResult);
                        }
                    )
                    .end(buffer);
            });

            publicId = uploadResult.public_id;
            format = uploadResult.format;
        }

        const existingAct = await Act.findOne({ novelId: novelId, actNumber: actNumber });

        if (existingAct) {
            return NextResponse.json({
                error: `Act số ${existingAct.actNumber} đã tồn tại trong tiểu thuyết này! Vui lòng chọn số thứ tự khác.`
            }, { status: 409 });
        }

        const newAct = new Act({
            novelId: novelId,
            title: title,
            actNumber: actNumber,
            actType: actType,
            publicId: publicId,
            format: format,
            createdAt: Date.now()
        });
        await newAct.save();

        return NextResponse.json({ success: true }, { status: 201 });
    } catch (error) {
        console.error('Lỗi khi tạo act:', error);
        return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const { id: novelId } = await context.params;

        await connectDB();

        const novel = await Novel.findById(novelId);
        if (!novel) {
            return NextResponse.json({ error: 'Novel không tồn tại!' }, { status: 404 });
        }

        const formData = await request.formData();
        const actId = formData.get('actId') as string;
        const userId = formData.get('userId') as string;
        const title = formData.get('title') as string;
        const actNumberStr = formData.get('actNumber') as string;
        const actType = formData.get('actType') as string;
        const file = formData.get('file') as File | null;
        const actNumber = parseInt(actNumberStr, 10);

        if (userId.toString() !== novel.authorId.toString()) {
            return NextResponse.json({ error: 'Bạn không có quyền thực hiện thao tác này!' }, { status: 403 });
        }

        const act = await Act.findById(actId);
        if (!act) {
            return NextResponse.json({ error: 'Act không tồn tại!' }, { status: 404 });
        }

        // Nếu đổi số actNumber, kiểm tra trùng
        if (actNumber && actNumber !== act.actNumber) {
            const existingAct = await Act.findOne({ novelId, actNumber });
            if (existingAct) {
                return NextResponse.json(
                    { error: `Act số ${actNumber} đã tồn tại!` },
                    { status: 409 }
                );
            }
            act.actNumber = actNumber;
        }

        if (title) act.title = title;
        if (actType) act.actType = actType;

        // Nếu có file mới
        if (file) {
            // Nếu có file cũ => xóa trên cloudinary
            if (act.publicId) {
                await cloudinary.uploader.destroy(act.publicId);
            }

            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const uploadResult = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
                cloudinary.uploader
                    .upload_stream(
                        { resource_type: 'auto', folder: 'LightNovel/BookCover' },
                        (err, result) => {
                            if (err) reject(err);
                            else resolve(result as CloudinaryUploadResult);
                        }
                    )
                    .end(buffer);
            });

            act.publicId = uploadResult.public_id;
            act.format = uploadResult.format;
        }

        await act.save();

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error('Lỗi khi cập nhật act:', error);
        return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const { id: novelId } = await context.params;
        await connectDB();

        const novel = await Novel.findById(novelId);
        if (!novel) {
            return NextResponse.json({ error: 'Novel không tồn tại!' }, { status: 404 });
        }
        const formData = await request.formData();
        const userId = formData.get('userId') as string;
        const title = formData.get('title') as string;
        const file = formData.get('file') as File | null;
        const status = formData.get('status') as string;
        const description = formData.get('description') as string;
        const genresId: string[] = formData.getAll('genresId') as string[];

        if (userId.toString() !== novel.authorId.toString()) {
            return NextResponse.json({ error: 'Bạn không có quyền thực hiện thao tác này!' }, { status: 403 });
        }

        if (title) novel.title = title;
        if (status) novel.status = status;
        if (description) novel.description = description;

        if (Array.isArray(genresId) && genresId.length > 0) {
            novel.genresId = genresId;
        }
        // Nếu có file mới
        if (file) {
            // Nếu có file cũ => xóa trên cloudinary
            if (novel.coverImage.publicId) {
                await cloudinary.uploader.destroy(novel.coverImage.publicId);
            }

            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const uploadResult = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
                cloudinary.uploader
                    .upload_stream(
                        { resource_type: 'auto', folder: 'LightNovel/BookCover' },
                        (err, result) => {
                            if (err) reject(err);
                            else resolve(result as CloudinaryUploadResult);
                        }
                    )
                    .end(buffer);
            });

            novel.coverImage.publicId = uploadResult.public_id;
            novel.coverImage.format = uploadResult.format;
        }

        await novel.save();
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const { id: novelId } = await context.params;

        await connectDB();

        const novel = await Novel.findById(novelId);
        if (!novel) {
            return NextResponse.json({ error: 'Novel không tồn tại!' }, { status: 404 });
        }

        const formData = await request.formData();
        const actId = formData.get('actId') as string;
        const userId = formData.get('userId') as string;

        if (userId.toString() !== novel.authorId.toString()) {
            return NextResponse.json({ error: 'Bạn không có quyền thực hiện thao tác này!' }, { status: 403 });
        }

        const act = await Act.findById(actId);
        if (!act) {
            return NextResponse.json({ error: 'Act không tồn tại!' }, { status: 404 });
        }

        if (act.publicId) {
            await cloudinary.uploader.destroy(act.publicId);
        }

        await Act.findOneAndDelete({ _id: actId })

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
    }
}
