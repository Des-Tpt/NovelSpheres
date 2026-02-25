import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/model/User";
import { Novel } from "@/model/Novel";

// Import để đăng ký Schema (Bắt buộc nếu dùng populate/lookup với Ref)
import "@/model/Genre";
import "@/model/Act";
import "@/model/Chapter";

export async function GET(request: NextRequest) {
    try {
        await connectDB();
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search') || '';

        const currentUser = await getCurrentUser();
        if (!currentUser) return NextResponse.json({ success: false, message: 'Vui lòng đăng nhập!' }, { status: 401 });

        const user = await User.findById(currentUser._id);
        if (!user || user.role !== 'admin') return NextResponse.json({ success: false, message: 'Bạn không có quyền!' }, { status: 403 });

        const matchQuery: any = {};
        if (search) {
            matchQuery.title = { $regex: search, $options: 'i' };
        }

        const skip = (page - 1) * limit;

        const [novels, total] = await Promise.all([
            Novel.aggregate([
                { $match: matchQuery },
                { $sort: { createdAt: -1 } },
                { $skip: skip },
                { $limit: limit },
                {
                    $lookup: {
                        from: 'User',
                        localField: 'authorId',
                        foreignField: '_id',
                        as: 'author'
                    }
                },
                { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: 'Act',
                        let: { novelId: '$_id' },
                        pipeline: [
                            { $match: { $expr: { $eq: ['$novelId', '$$novelId'] } } },
                            { $sort: { actNumber: 1 } },
                            {
                                $lookup: {
                                    from: 'Chapter',
                                    let: { actId: '$_id' },
                                    pipeline: [
                                        { $match: { $expr: { $eq: ['$actId', '$$actId'] } } },
                                        { $count: 'chaptersCount' }
                                    ],
                                    as: 'chapterStats'
                                }
                            },
                            {
                                $addFields: {
                                    chaptersCount: {
                                        $ifNull: [{ $arrayElemAt: ['$chapterStats.chaptersCount', 0] }, 0]
                                    }
                                }
                            },
                            {
                                $project: {
                                    _id: 1,
                                    title: 1,
                                    actNumber: 1,
                                    chaptersCount: 1
                                }
                            }
                        ],
                        as: 'acts'
                    }
                },
                {
                    $lookup: {
                        from: 'Chapter',
                        localField: '_id',
                        foreignField: 'novelId',
                        as: 'allChapters'
                    }
                },
                {
                    $project: {
                        _id: 1,
                        title: 1,
                        coverImage: 1,
                        status: 1,
                        state: 1,
                        views: 1,
                        rating: 1,
                        createdAt: 1,
                        authorName: '$author.username',
                        acts: 1,
                        totalChapters: { $size: '$allChapters' }
                    }
                }
            ]),
            Novel.countDocuments(matchQuery)
        ]);

        return NextResponse.json({
            success: true,
            data: novels,
            pagination: {
                totalElements: total,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
                limit: limit
            }
        }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ success: false, message: 'Lỗi server' }, { status: 500 });
    }
}
