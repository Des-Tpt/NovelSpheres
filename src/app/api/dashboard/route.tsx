import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/model/User';
import { Novel } from '@/model/Novel';
import { Chapter } from '@/model/Chapter';
import { Comment } from '@/model/Comment';
import { ForumPost } from '@/model/PostForum';

export async function GET() {
    try {
        await connectDB();

        const now = new Date();
        const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [
            totalUsers,
            totalNovels,
            totalChapters,
            totalComments,
            totalForumPosts,
            prevTotalUsers,
            prevTotalNovels,
            prevTotalChapters,
            prevTotalComments,
            prevTotalForumPosts,
            totalWordsResult,
            prevTotalWordsResult
        ] = await Promise.all([
            User.countDocuments({ isDeleted: false }),
            Novel.countDocuments(),
            Chapter.countDocuments(),
            Comment.countDocuments({ isDeleted: false }),
            ForumPost.countDocuments(),

            User.countDocuments({ isDeleted: false, createdAt: { $lt: startOfCurrentMonth } }),
            Novel.countDocuments({ createdAt: { $lt: startOfCurrentMonth } }),
            Chapter.countDocuments({ createdAt: { $lt: startOfCurrentMonth } }),
            Comment.countDocuments({ isDeleted: false, createdAt: { $lt: startOfCurrentMonth } }),
            ForumPost.countDocuments({ createdAt: { $lt: startOfCurrentMonth } }),

            Chapter.aggregate([
                { $group: { _id: null, totalWords: { $sum: '$wordCount' } } }
            ]),

            Chapter.aggregate([
                { $match: { createdAt: { $lt: startOfCurrentMonth } } },
                { $group: { _id: null, totalWords: { $sum: '$wordCount' } } }
            ])
        ]);

        const calculateGrowth = (current: number, previous: number) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            const currentMonthNew = current - previous;
            return Number(((currentMonthNew / previous) * 100).toFixed(1));
        };

        const totalWords = totalWordsResult.length > 0 ? totalWordsResult[0].totalWords : 0;
        const prevTotalWords = prevTotalWordsResult.length > 0 ? prevTotalWordsResult[0].totalWords : 0;

        const growthRates = {
            users: calculateGrowth(totalUsers, prevTotalUsers),
            novels: calculateGrowth(totalNovels, prevTotalNovels),
            chapters: calculateGrowth(totalChapters, prevTotalChapters),
            comments: calculateGrowth(totalComments, prevTotalComments),
            forumPosts: calculateGrowth(totalForumPosts, prevTotalForumPosts),
            words: calculateGrowth(totalWords, prevTotalWords),
        };

        const userStats = await User.aggregate([
            { $match: { isDeleted: false } },
            { $group: { _id: '$role', count: { $sum: 1 } } }
        ]);

        const formattedUserStats = {
            reader: userStats.find(s => s._id === 'reader')?.count || 0,
            writer: userStats.find(s => s._id === 'writer')?.count || 0,
            admin: userStats.find(s => s._id === 'admin')?.count || 0,
        };

        const novelsByState = await Novel.aggregate([
            { $group: { _id: '$state', count: { $sum: 1 } } }
        ]);
        const novelsByStatus = await Novel.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const formattedNovelStats = {
            state: {
                draft: novelsByState.find(s => s._id === 'Draft')?.count || 0,
                published: novelsByState.find(s => s._id === 'Published')?.count || 0,
            },
            status: {
                ongoing: novelsByStatus.find(s => s._id === 'Ongoing')?.count || 0,
                completed: novelsByStatus.find(s => s._id === 'Completed')?.count || 0,
                hiatus: novelsByStatus.find(s => s._id === 'Hiatus')?.count || 0,
            }
        };

        const topViewedNovels = await Novel.find({ state: 'Published' })
            .sort({ views: -1 })
            .limit(5)
            .select('title views likes rating authorId')
            .populate('authorId', 'username');

        const topRatedNovels = await Novel.find({ state: 'Published', ratingsCount: { $gt: 0 } })
            .sort({ rating: -1, ratingsCount: -1 })
            .limit(5)
            .select('title views likes rating ratingsCount authorId')
            .populate('authorId', 'username');

        const newestUsers = await User.find({ isDeleted: false })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('username role email createdAt profile')
            .populate('profile', 'avatar');

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const mostActiveNovelsRaw = await Chapter.aggregate([
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            { $group: { _id: '$novelId', chaptersCount: { $sum: 1 } } },
            { $sort: { chaptersCount: -1 } },
            { $limit: 5 }
        ]);

        const mostActiveNovels = await Novel.populate(mostActiveNovelsRaw, {
            path: '_id',
            select: 'title authorId',
            populate: { path: 'authorId', select: 'username' }
        });

        return NextResponse.json({
            success: true,
            data: {
                overview: {
                    totalUsers: { count: totalUsers, growth: growthRates.users },
                    totalNovels: { count: totalNovels, growth: growthRates.novels },
                    totalChapters: { count: totalChapters, growth: growthRates.chapters },
                    totalComments: { count: totalComments, growth: growthRates.comments },
                    totalForumPosts: { count: totalForumPosts, growth: growthRates.forumPosts },
                    totalWords: { count: totalWords, growth: growthRates.words }
                },
                userStats: formattedUserStats,
                novelStats: formattedNovelStats,
                topPerformers: {
                    topViewed: topViewedNovels,
                    topRated: topRatedNovels,
                    mostActiveNovels
                },
                recentActivity: {
                    newestUsers
                }
            }
        }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({ success: false, message: "Lỗi khi lấy dữ liệu dashboard", error: error.message }, { status: 500 });
    }
}