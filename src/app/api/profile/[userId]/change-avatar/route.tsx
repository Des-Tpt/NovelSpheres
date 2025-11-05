import cloudinary from "@/lib/cloudinary";
import { connectDB } from "@/lib/db";
import { User } from "@/model/User";
import { NextRequest, NextResponse } from "next/server";

interface CloudinaryUploadResult {
    public_id: string;
    format: string;
}

export async function POST(req: NextRequest, context: { params: Promise<{ userId: string }> }) {
    const { userId } = await context.params;
    const formData = await req.formData();
    const file = formData.get('avatar') as File;

    try {
        await connectDB();
        if (!file) {
            return NextResponse.json({ message: "Thiếu dữ liệu cần thiết." }, { status: 400 });
        }

        let avatar: { publicId: string; format: string } | null = null;

        if (file) {
            const user = await User.findById(userId);
            if (user?.profile?.avatar) {
                await cloudinary.uploader.destroy(user.profile.avatar.publicId);
            }

            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const uploadResult = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
                cloudinary.uploader
                    .upload_stream(
                        {
                            resource_type: 'auto',
                            folder: 'LightNovel/Avatar',
                            width: 350,
                            height: 350,
                            crop: "fill",
                            gravity: "center",
                        },
                        (err, result) => {
                            if (err) reject(err);
                            else resolve(result as CloudinaryUploadResult);
                        }
                    )
                    .end(buffer);
            });

            avatar = {
                publicId: uploadResult.public_id,
                format: uploadResult.format
            };
        }

        await User.findByIdAndUpdate(userId, {
            $set: {
                "profile.avatar.publicId": avatar?.publicId,
                "profile.avatar.format": avatar?.format
            }
        })

        return NextResponse.json(
            { message: "Cập nhật ảnh đại diện thành công!", avatar },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json(
            { message: "Đã xảy ra lỗi khi cập nhật ảnh đại diện." },
            { status: 500 }
        );
    }
}