import { v2 as cloudinary } from 'cloudinary';
import { NextRequest, NextResponse } from 'next/server';
import { Novel } from '@/model/Novel';
import { INovel } from '@/model/Novel';
import { User } from '@/model/User';
import { IUser } from '@/model/User';
import { Genre, IGenre } from '@/model/Genre';
import { Chapter } from '@/model/Chapter';
import { connectDB } from '@/lib/db';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {

    console.log(Genre.modelName);
    console.log(User.modelName);
    console.log(Novel.modelName);
    console.log(Chapter.modelName);

    try {
        await connectDB();

        const novels = await Novel.aggregate([{ $sample: {size: 4}}]) as INovel[];

        const featuredNovels = await Promise.all(novels.map(getFeaturedNovelData));

        return NextResponse.json(featuredNovels);

    } catch (e) {
        console.log(e);
        return NextResponse.json({ error: 'Không thể lấy thông tin.' }, { status: 500 });
    }
}

async function getFeaturedNovelData(novel: INovel) {
    const chapterCount = await Chapter.countDocuments({ novelId: novel._id });
    const user = await User.findById(novel.authorId).lean<IUser>();
    const firstGenreId = novel.genresId[0];
    const genres = await Genre.findById(firstGenreId).lean<IGenre>();    
    const rating =
            typeof novel.rating === 'object' &&
            novel.rating !== null &&
            typeof (novel.rating as any).toString === 'function'
                ? parseFloat((novel.rating as any).toString())
                : novel.rating;
    const base = {
        ...novel,
        chapterCount: chapterCount,
        authorName: user?.username || 'Vô danh',
        firstGenreName: genres?.name || 'Không rõ',
        rating,
    };

    return base;
}
