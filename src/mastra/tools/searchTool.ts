
//  Tool 1: Semantic Search trong nội dung novel
//  Use case: "Tìm cảnh Naruto vs Sasuke", "Tìm đoạn nói về tình yêu"
{/*
export const searchNovelContentTool = createTool({
    id: 'search-novel-content',
    description: `
        Tìm kiếm NGỮ NGHĨA trong nội dung tiểu thuyết.
        Dùng khi cần tìm: tình tiết, cảnh, đoạn hội thoại, mô tả cụ thể.
        Ví dụ: "cảnh chiến đấu", "lời tỏ tình", "mô tả phong cảnh"
    `,
    inputSchema: z.object({
        query: z.string()
            .min(1)
            .max(500)
            .describe('Mô tả nội dung cần tìm (tiếng Việt hoặc tiếng Anh)'),
        topK: z.number()
            .optional()
            .default(10)
            .describe('Số lượng đoạn văn cần trả về'),
        novelId: z.string().optional().describe('Lọc theo ID tiểu thuyết'),
        actId: z.string().optional().describe('Lọc theo ID hồi/arc'),
        chapterId: z.string().optional().describe('Lọc theo ID chapter'),
    }),
    outputSchema: z.object({
        results: z.array(
            z.object({
                id: z.string(),
                score: z.number(),
                text: z.string(),
                chapterId: z.string(),
                chapterNumber: z.string(),
                novelId: z.string(),
            })
        ),
        message: z.string(),
    }),
    execute: async ({ context }) => {
        const { query, topK = 10, novelId, actId, chapterId } = context;

        // Lọc theo mô tả nếu có
        const filter: Record<string, string> = {};
        if (novelId) filter.novelId = novelId;
        if (actId) filter.actId = actId;
        if (chapterId) filter.chapterId = chapterId;

        const result = await searchNovelFromPinecone(query, topK, filter);

        // Format kết quả
        const formattedResults = result.results.map(r => ({
            id: r.id,
            score: r.score,
            text: r.text,
            chapterId: r.metadata.chapterId as string,
            chapterNumber: r.metadata.chapterNumber as string,
            novelId: r.metadata.novelId as string,
        }));

        return {
            results: formattedResults,
            message: result.message,
        };
    }
});


//  Tool 2: Metadata Search trong MongoDB
//  Use case: "Tìm chapter 15", "Tìm novel Naruto", "Tìm arc Chunin Exam"

export const searchNovelFromCollectionTool = createTool({
    id: 'search-novel-metadata',
    description: `
        Tìm kiếm theo METADATA: tên novel, tên chapter, số chapter, tên arc/act, nhân vật.
        Dùng khi cần tìm: chapter cụ thể, novel cụ thể, arc cụ thể, hoặc nhân vật xuất hiện.
        Ví dụ: "chapter 15", "novel Naruto", "arc Chunin Exam", "chapters có Sasuke"
    `,
    inputSchema: z.object({
        titleNovel: z.string().optional().describe('Tên tiểu thuyết (fuzzy search)'),
        chapterNumber: z.number().optional().describe('Số chapter'),
        chapterTitle: z.string().optional().describe('Tên chapter (fuzzy search)'),
        actTitle: z.string().optional().describe('Tên hồi/arc (fuzzy search)'),
        characters: z.array(z.string()).optional().describe('Danh sách tên nhân vật'),
        limit: z.number().optional().default(10).describe('Số lượng kết quả tối đa'),
    }),
    outputSchema: z.object({
        success: z.boolean(),
        chapters: z.array(z.any()),
        message: z.string(),
    }),
    execute: async ({ context }) => {
        const { limit = 10, ...filters } = context;
        return await searchInMongoDB(filters, limit);
    }
});

//  Tool 3: Hybrid Search - Kết hợp cả semantic + metadata
//  Use case: "Tìm cảnh Naruto chiến đấu trong arc Chunin Exam"

export const searchNovelHybridTool = createTool({
    id: 'search-novel-hybrid',
    description: `
        Tìm kiếm KẾT HỢP: vừa theo nội dung, vừa theo metadata.
        Dùng khi query phức tạp có cả: nội dung + metadata.
        Ví dụ: "cảnh chiến đấu trong arc Chunin Exam", "lời tỏ tình trong chapter 50"
    `,
    inputSchema: z.object({
        contentQuery: z.string().describe('Mô tả nội dung cần tìm'),
        titleNovel: z.string().optional(),
        actTitle: z.string().optional(),
        chapterNumber: z.number().optional(),
        topK: z.number().optional().default(10),
    }),
    outputSchema: z.object({
        results: z.array(z.any()),
        message: z.string(),
    }),
    execute: async ({ context }) => {
        const { contentQuery, titleNovel, actTitle, chapterNumber, topK = 10 } = context;

        // Bước 1: Tìm metadata trước (để lấy IDs)
        const metadataFilters: any = {};
        if (titleNovel) metadataFilters.titleNovel = titleNovel;
        if (actTitle) metadataFilters.actTitle = actTitle;
        if (chapterNumber) metadataFilters.chapterNumber = chapterNumber;

        let filter: Record<string, string> = {};

        if (Object.keys(metadataFilters).length > 0) {
            const metadataResult = await searchInMongoDB(metadataFilters, 100);

            if (!metadataResult.success || metadataResult.chapters.length === 0) {
                return {
                    results: [],
                    message: 'Không tìm thấy metadata phù hợp'
                };
            }

            // Lấy IDs từ metadata
            const novelIds = [...new Set(metadataResult.chapters.map(c => c.novelId._id.toString()))];
            if (novelIds.length === 1) {
                filter.novelId = novelIds[0];
            }
        }

        // Bước 2: Semantic search với filter
        const semanticResult = await searchNovelFromPinecone(contentQuery, topK, filter);

        // Bước 3: Populate thông tin chapter
        const chapterIds = [...new Set(semanticResult.results.map(r => r.metadata.chapterId))];

        await connectDB();
        const chapters = await Chapter.find({ _id: { $in: chapterIds } })
            .populate([
                { path: 'novelId', select: 'title' },
                { path: 'actId', select: 'title actNumber' }
            ])
            .lean();

        // Merge data
        const results = semanticResult.results.map(r => {
            const chapter = chapters.find((c: any) => c._id.toString() === r.metadata.chapterId);
            return {
                text: r.text,
                score: r.score,
                chapter: chapter ? {
                    id: chapter._id,
                    title: chapter.title,
                    number: chapter.chapterNumber,
                    novel: chapter.novelId,
                    act: chapter.actId,
                } : null
            };
        });

        return {
            results,
            message: `Tìm thấy ${results.length} kết quả kết hợp`
        };
    }
});
*/}