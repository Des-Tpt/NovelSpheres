import cloudinary from "@/lib/cloudinary";
import { connectDB } from "@/lib/db";
import { Novel } from "@/model/Novel";
import { User } from "@/model/User";
import { NextRequest, NextResponse } from "next/server";

interface CloudinaryUploadResult {
    public_id: string;
    format: string;
}

export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const formData = await request.formData();
        const userId = formData.get('userId') as string;
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const status = formData.get('status') as string;
        const genresId: string[] = formData.getAll('genresId') as string[];
        const file = formData.get('file') as File | null;

        let publicId: string | null = null;
        let format: string | null = null;

        if (!title || !userId || genresId.length === 0) {
            return NextResponse.json({ error: 'Thiếu dữ liệu bắt buộc' }, { status: 400 });
        }

        if (file) {
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

        const newNovel = new Novel({
            title: title,
            description: description,
            status: status,
            authorId: userId,
            genresId: genresId,
            coverImage: publicId && format ? { publicId, format } : undefined,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        })
        
        await newNovel.save();

        await User.findByIdAndUpdate(userId, { $set: { role: 'writer' }});

        return NextResponse.json({ success: true }, { status: 201 });
    } catch (e) {
        return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
    }


}