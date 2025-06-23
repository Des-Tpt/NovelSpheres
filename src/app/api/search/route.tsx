import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Genre } from '@/model/Genre';
import { User } from '@/model/User';
import { Novel } from '@/model/Novel';
import { models } from 'mongoose';
import { Chapter } from '@/model/Chapter';


export const dynamic = 'force-dynamic'; //Sẽ luôn fetch dữ liệu mới nhất vì render server-side, không bị cached lại.

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');


    console.log(Genre.modelName);
    console.log(User.modelName);
    console.log(Novel.modelName);
    console.log(Chapter.modelName);

    if (!query || query.trim() === '') {
        console.log("Trống query → trả mảng rỗng");
        return NextResponse.json([]);
    }

    await connectDB();
    
    try {
        const decodedQuery = decodeURIComponent(query);
        const novels = await Novel.find({ title: { $regex: new RegExp(decodedQuery, 'i') } })
            .collation({ locale: 'vi', strength: 1 })         
            .limit(5)
            .select('title coverImage _id genresId authorId rating status')
            .populate('authorId', 'username')
            .populate('genresId', 'name');

        const novelsWithChapterCount = await Promise.all(
            novels.map(async (novel) => {
                const chapterCount = await models.Chapter.countDocuments({ novelId: novel._id });
                return {
                    ...novel.toObject(),
                    chapterCount: chapterCount
                };
            }));
        return NextResponse.json(novelsWithChapterCount);

    } catch (error) {
        console.error("Lỗi khi tìm kiếm:", error);
        return NextResponse.json({ error: 'Lỗi khi tìm kiếm' }, { status: 500 });
    }
}
