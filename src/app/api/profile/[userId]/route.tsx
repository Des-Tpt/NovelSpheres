import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { User } from '@/model/User';
import { Profile } from '@/model/Profile';
import { Follow } from '@/model/Following';
import { Novel } from '@/model/Novel';
import { Likes } from '@/model/Likes';
import { connectDB } from '@/lib/db';
import { IGenre } from '@/model/Genre';
import { History } from '@/model/History';
import { error } from 'console';
import { getCurrentUser } from '@/lib/auth';
import cloudinary from '@/lib/cloudinary';
import { use } from 'react';
import { cookies } from 'next/headers';


export async function GET(request: NextRequest, context: { params: Promise<{ userId: string }> }) {
    try {
        await connectDB();

        const { userId: userId } = await context.params;

        const profile = await Profile.findOne({ userId });
        if (!profile) {
            return NextResponse.json(
                { error: 'Không tin thấy thông tin tài khoản!' },
                { status: 404 }
            );
        }

        const novels = await Novel.find({ authorId: userId })
            .populate('authorId', 'username')
            .populate('genresId', '_id name')
            .sort({ createdAt: -1 });

        // Lấy Likes của user này (novels mà user đã like)
        const likes = await Likes.find({ userId: userId })
            .populate({
                path: 'novelId',
                populate: [
                    { path: 'authorId', select: 'username' },
                    { path: 'genresId', select: '_id name' }
                ]
            })
            .sort({ createdAt: -1 });

        // Lấy thống kê followers/following
        const [followersCount, followingCount] = await Promise.all([
            Follow.countDocuments({ followingUserId: userId }),
            Follow.countDocuments({ followerUserId: userId })
        ]);

        const histories = await History.find({ userId: userId })
            .populate({
                path: 'novelId',
                populate: [
                    { path: 'authorId', select: 'username' },
                    { path: 'genresId', select: '_id name' }
                ]
            })
            .sort({ createdAt: -1 });

        const user = await User.findById(userId).lean() as any;

        const followed: boolean | null = await Follow.findOne({ userId: user._id, followingUserId: profile.userId });

        const responseData = {
            // User data
            user: {
                _id: user._id.toString(),
                username: user.username,
                email: user.email,
                role: user.role,
                profile: {
                    bio: user.profile?.bio,
                    avatar: user.profile?.avatar ? {
                        publicId: user.profile.avatar.publicId,
                        format: user.profile.avatar.format
                    } : undefined
                },
                createdAt: user.createdAt
            },
            // Profile data
            profile: {
                userId: profile.userId.toString(),
                bio: profile.bio || '',
                socials: {
                    facebook: profile.socials?.facebook,
                    twitter: profile.socials?.twitter,
                    discord: profile.socials?.discord,
                    website: profile.socials?.website
                },
                stats: {
                    followers: followersCount,
                    following: followingCount,
                    totalViews: profile.stats?.totalViews || 0,
                    totalNovels: novels.length
                },
                birthday: profile.birthday,
                occupation: profile.occupation,
                favorites: profile.favorites,
                coverImage: {
                    publicId: profile.coverImage?.publicId,
                    format: profile.coverImage?.format
                },
                createdAt: profile.createdAt,
                updatedAt: profile.updatedAt
            },

            novels: novels.map(novel => ({
                _id: novel._id.toString(),
                title: novel.title,
                authorId: novel.authorId ? { username: novel.authorId.username } : undefined,
                description: novel.description,
                coverImage: novel.coverImage ? {
                    publicId: novel.coverImage.publicId,
                    format: novel.coverImage.format
                } : undefined,
                genresId: novel.genresId?.map((genre: IGenre) => ({
                    _id: genre._id.toString(),
                    name: genre.name
                })),
                status: novel.status,
                views: novel.views || 0,
                likes: novel.likes || 0,
                rating: novel.rating || 0,
                ratingsCount: novel.ratingsCount || 0,
                createdAt: novel.createdAt,
                updatedAt: novel.updatedAt
            })),

            likes: likes.map(like => ({
                _id: like._id.toString(),
                userId: like.userId.toString(),
                novelId: {
                    _id: like.novelId._id.toString(),
                    title: like.novelId.title,
                    authorId: like.novelId.authorId ? { username: like.novelId.authorId.username } : undefined,
                    description: like.novelId.description,
                    coverImage: like.novelId.coverImage ? {
                        publicId: like.novelId.coverImage.publicId,
                        format: like.novelId.coverImage.format
                    } : undefined,
                    genresId: like.novelId.genresId?.map((genre: IGenre) => ({
                        _id: genre._id.toString(),
                        name: genre.name
                    })),
                    status: like.novelId.status,
                    views: like.novelId.views || 0,
                    likes: like.novelId.likes || 0,
                    rating: like.novelId.rating || 0,
                    ratingsCount: like.novelId.ratingsCount || 0,
                    createdAt: like.novelId.createdAt,
                    updatedAt: like.novelId.updatedAt
                },
                createdAt: like.createdAt
            })),
            followed: !!followed,
        };

        return NextResponse.json(responseData);

    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: 'Lỗi server' },
            { status: 500 }
        );
    }
}

interface CloudinaryUploadResult {
    public_id: string;
    format: string;
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ userId: string }> }) {
    const { userId: userId } = await context.params;
    await connectDB();

    try {
        const profile = await Profile.findOne({ userId: userId }).lean() as any;

        if (!profile) return NextResponse.json({ error: 'Không tìm thấy trang cá nhân!' }, { status: 404 })

        const formData = await request.formData();
        const bio = formData.get('bio') as string;
        const birthday = formData.get('birthday');
        const favorites = formData.get('favorites') as string;
        const occupation = formData.get('occupation') as string;
        const avatarRaw = formData.get('avatar') as File || null;
        const coverImageRaw = formData.get('coverImage') as File || null;

        const currentUser = await getCurrentUser();

        if (currentUser?._id.toString() !== userId.toString()) {
            return NextResponse.json({ error: 'Bạn không có quyền thực hiện thao tác này!' }, { status: 403 });
        }

        let avatar: { publicId: string; format: string } | undefined;

        if (avatarRaw) {
            const user = await User.findById(userId);
            if (user?.profile?.avatar) {
                await cloudinary.uploader.destroy(user.profile.avatar.publicId);
            }

            const arrayBuffer = await avatarRaw.arrayBuffer();
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

        let coverImage: { publicId: string, format: string } | undefined;

        if (coverImageRaw) {
            if (profile.coverImage) {
                await cloudinary.uploader.destroy(profile.coverImage.publicId);
            }

            const arrayBuffer = await coverImageRaw.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const uploadResult = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
                cloudinary.uploader
                    .upload_stream(
                        {
                            resource_type: 'auto',
                            folder: 'LightNovel/Avatar/CoverImage',
                            width: 1600,
                            crop: "fill",
                            gravity: "auto"
                        },
                        (err, result) => {
                            if (err) reject(err);
                            else resolve(result as CloudinaryUploadResult);
                        }
                    )
                    .end(buffer);
            });

            coverImage = {
                publicId: uploadResult.public_id,
                format: uploadResult.format
            };
        }

        const updateData: any = {
            bio: bio || profile.bio || '',
            birthday: birthday ? new Date(birthday as string) : profile.birthday || null,
            favorites: favorites || profile.favorites || '',
            occupation: occupation || profile.occupation || '',
            socials: {
                facebook: formData.get('facebook') as string || profile.socials?.facebook || '',
                twitter: formData.get('twitter') as string || profile.socials?.twitter || '',
                discord: formData.get('discord') as string || profile.socials?.discord || '',
                website: formData.get('website') as string || profile.socials?.website || ''
            },
        };

        // Chỉ cập nhật coverImage nếu có file mới
        if (coverImage) {
            updateData.coverImage = {
                publicId: coverImage.publicId,
                format: coverImage.format
            };
        }

        await Profile.findOneAndUpdate({ userId: userId }, updateData);

        // Cập nhật avatar trong User model nếu có
        if (avatar) {
            await User.findByIdAndUpdate(userId, {
                'profile.avatar': avatar
            });
        }
        return NextResponse.json({ success: true, avatar: avatar }, { status: 200 });
    } catch (error) {
        console.error('Profile update error:', error);
        return NextResponse.json({ error: 'Lỗi server!' }, { status: 500 })
    }
}