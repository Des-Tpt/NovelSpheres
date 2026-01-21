import cloudinary from "@/lib/cloudinary";
import { connectDB } from "@/lib/db";
import { pusherServer } from "@/lib/pusher-server";
import { Follow } from "@/model/Following";
import { Notification } from "@/model/Notification";
import { Novel } from "@/model/Novel";
import { User } from "@/model/User";
import removeScriptsFromHtml from "@/utils/removeScript";
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
        const state = formData.get('state') as string || 'Draft';
        const genresId: string[] = formData.getAll('genresId') as string[];
        const file = formData.get('file') as File | null;

        let publicId: string | null = null;
        let format: string | null = null;
        let uploadedImageId: string | null = null;

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
            uploadedImageId = publicId;
            format = uploadResult.format;
        }

        const cleanDescription = removeScriptsFromHtml(description);
        try {
            const newNovel = new Novel({
                title: title,
                description: cleanDescription,
                status: status,
                state: state,
                authorId: userId,
                genresId: genresId,
                coverImage: publicId && format ? { publicId, format } : undefined,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            })

            await newNovel.save();

            if (state === 'Published') {
                const user = await User.findById(userId).select('username');

                const followers = await Follow.find({ followingUserId: userId })
                    .select('userId');

                const notifyPromises = followers.map(async (follower) => {
                    const message = `Tác giả ${user.username} vừa đăng tiểu thuyết mới: ${newNovel.title}`;
                    const href = `/novels/${newNovel._id.toString()}`;

                    const notif = await Notification.create({
                        userId: follower.userId,
                        type: 'chapter_update',
                        message,
                        href,
                        createdAt: Date.now(),
                    })

                    await pusherServer.trigger(`private-user-${follower.userId.toString()}`, "new-notification", {
                        id: notif._id,
                        message,
                        href,
                        createdAt: notif.createdAt
                    });
                });

                await Promise.all(notifyPromises);
            }

            await User.findByIdAndUpdate(
                { _id: userId, role: { $ne: 'admin' } },
                { $set: { role: 'writer' } }
            );

            return NextResponse.json({ success: true }, { status: 201 });
        } catch (novelError) {
            if (uploadedImageId) {
                await cloudinary.uploader.destroy(uploadedImageId);
            }
            return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
        }
    } catch (e) {
        return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
    }
}