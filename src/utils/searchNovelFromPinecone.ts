import { connectDB } from '@/lib/db';
import { Novel } from '@/model/Novel';
import { Chapter } from '@/model/Chapter';
import { Act } from '@/model/Act';
import { indexNovel } from '@/lib/pinecore';
import { embedMany } from 'ai';
import { google } from '@ai-sdk/google';

interface PineconeSearchResult {
    results: {
        id: string;
        score: number;
        text: string;
        metadata: Record<string, any>;
    }[];
    message: string;
}

export async function searchNovelFromPinecone(query: string, topK: number = 20, filter?: Record<string, string>): Promise<PineconeSearchResult> {
    // Embed query
    const normalizedQuery = query.trim().toLowerCase();

    query = normalizedQuery.replace(/\s+/g, ' ').trim();

    const { embeddings } = await embedMany({
        model: google.textEmbeddingModel('text-embedding-004'),
        values: [query],
    });

    const queryVector = embeddings[0];

    // Build search params
    const searchParams: any = {
        vector: queryVector,
        topK,
        includeMetadata: true,
        includeValues: false,
    };

    if (filter && Object.keys(filter).length > 0) {
        searchParams.filter = filter;
    }

    const searchResults = await indexNovel.query(searchParams);

    const results = searchResults.matches.map((match) => ({
        id: match.id,
        score: match.score || 0,
        text: match.metadata?.text as string || '',
        metadata: match.metadata || {},
    }));

    return {
        results,
        message: `Tìm thấy ${results.length} đoạn văn liên quan`,
    };
}


interface MongoSearchResult {
    success: boolean;
    chapters: any[];
    message: string;
}


//  Search trong MongoDB theo metadata

export async function searchInMongoDB(filters: Record<string, any>, limit: number = 10): Promise<MongoSearchResult> {
    try {
        await connectDB();

        // 1. Tìm novelId từ title (nếu có)
        let novelId: string | undefined;
        if (filters.titleNovel) {
            const novel = await Novel.findOne({
                title: { $regex: new RegExp(filters.titleNovel, 'i') }
            }).lean<any>();

            if (novel) {
                novelId = novel._id.toString();
            }
        }

        // 2. Xây dựng query cho Chapter
        const chapterQuery: any = {};
        if (novelId) {
            chapterQuery.novelId = novelId;
        }
        if (filters.chapterNumber) {
            chapterQuery.chapterNumber = filters.chapterNumber;
        }
        if (filters.chapterTitle) {
            chapterQuery.title = { $regex: new RegExp(filters.chapterTitle, 'i') };
        }

        // 3. Tìm actId từ actTitle (nếu có)
        if (filters.actTitle && novelId) {
            const act = await Act.findOne({
                novelId,
                title: { $regex: new RegExp(filters.actTitle, 'i') }
            }).lean<any>();

            if (act) {
                chapterQuery.actId = act._id.toString();
            }
        }

        // 4. ✅ TÌM NHÂN VẬT QUA PINECONE (thay vì regex)
        if (filters.characters && filters.characters.length > 0) {
            // Tạo semantic query
            const characterQuery = `chương bao gồm ${filters.characters.join(' và ')}`;

            // Search trong Pinecone
            const pineconeResults = await searchNovelFromPinecone(
                characterQuery,
                50,  // Lấy nhiều để có đủ chapters
                novelId ? { novelId } : undefined
            );

            // Lấy unique chapterIds
            const chapterIds = [...new Set(
                pineconeResults.results
                    .filter(r => r.score > 0.7)  // Chỉ lấy kết quả có score cao
                    .map(r => r.metadata.chapterId)
            )];

            if (chapterIds.length > 0) {
                chapterQuery._id = { $in: chapterIds };
            } else {
                // Không tìm thấy chapter nào
                return {
                    success: true,
                    chapters: [],
                    message: `Không tìm thấy chapter nào có ${filters.characters.join(', ')}`
                };
            }
        }

        // 5. Thực hiện query MongoDB
        const chapters = await Chapter.find(chapterQuery)
            .limit(limit)
            .sort({ chapterNumber: 1 })  // Sắp xếp theo số chapter
            .populate([
                { path: 'novelId', select: 'title authorId' },
                { path: 'actId', select: 'title actNumber' }
            ])
            .lean<any>();

        return {
            success: true,
            chapters,
            message: `Tìm thấy ${chapters.length} chapter`
        };

    } catch (error) {
        console.error('MongoDB search error:', error);
        return {
            success: false,
            chapters: [],
            message: 'Lỗi khi tìm kiếm: ' + (error as Error).message
        };
    }
}
