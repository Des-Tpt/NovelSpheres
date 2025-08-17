import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { User } from '@/model/User';
import { Profile } from '@/model/Profile';
import { Follow } from '@/model/Following';
import { Novel } from '@/model/Novel';
import { Likes } from '@/model/Likes';
import { connectDB } from '@/lib/db';
import { IGenre } from '@/model/Genre';
import { History } from '@/model/History';


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

            history: histories.map(history => ({
                _id: history._id.toString(),
                userId: history.userId.toString(),
                novelId: {
                    _id: history.novelId._id.toString(),
                    title: history.novelId.title,
                    authorId: history.novelId.authorId ?
                        { username: history.novelId.authorId.username } : undefined,
                    description: history.novelId.description,
                    coverImage: history.novelId.coverImage ? {
                        publicId: history.novelId.coverImage.publicId,
                        format: history.novelId.coverImage.format
                    } : undefined,
                    genresId: history.novelId.genresId?.map((genre: IGenre) => ({
                        _id: genre._id.toString(),
                        name: genre.name
                    })),
                    status: history.novelId.status,
                    views: history.novelId.views || 0,
                    likes: history.novelId.likes || 0,
                    rating: history.novelId.rating || 0,
                    ratingsCount: history.novelId.ratingsCount || 0,
                    createdAt: history.novelId.createdAt,
                    updatedAt: history.novelId.updatedAt
                },
                createdAt: history.lastReadAt
            }))
        };

        return NextResponse.json(responseData);

    } catch (error) {
        console.error('GET Profile error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}