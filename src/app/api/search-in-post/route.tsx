import { connectDB } from '@/lib/db';
import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { Novel } from '@/model/Novel';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');

    if (!query || query.trim() === '') {
        return NextResponse.json([])
    }

    try {
        await connectDB();

        const decodedQuery = decodeURIComponent(query);
        const novels = await Novel.find({ title: { $regex: new RegExp(decodedQuery, 'i') } })
            .collation({ locale: 'vi', strength: 1 })
            .limit(5)
            .select('title rating status')
        return NextResponse.json(novels);
    } catch {
        return NextResponse.json({ error: 'Lỗi khi tìm kiếm' }, { status: 500 });
    }
}