import { embedMany } from "ai";
import { google } from "@ai-sdk/google";
import { indexNovel } from "@/lib/pinecore";

async function upsertNovelChunks(
    chunks: string[],
    novelId: string,
    actId: string,
    chapterId: string,
    chapterNumber: string,
    authorId: string,
    chapterTitle?: string
) {
    // ✨ Bước 1: Tạo context cho mỗi chunk
    const contextualChunks = chunks.map((chunk, index) => {
        const prefix = `Tiểu thuyết: ${novelId || "Không rõ"} | Act: ${actId || "Không rõ"} | Chương ${chapterNumber}: ${chapterTitle || ""}\n`;
        return prefix + chunk;
    });

    // ✨ Bước 2: Embed với context
    const { embeddings } = await embedMany({
        model: google.textEmbeddingModel("text-embedding-004"),
        values: contextualChunks,
    });

    // ✨ Bước 3: Upsert vector
    const vectors = contextualChunks.map((chunk, index) => ({
        id: `${chapterId}_${index}`,
        values: embeddings[index],
        metadata: {
            novelId: novelId || "",
            actId: actId || "",
            chapterId: chapterId || "",
            authorId: authorId || "",
            chapterNumber: chapterNumber || "",
            text: chunks[index], // giữ bản gốc, không phải bản prefix
        },
    }));

    await indexNovel.upsert(vectors);
}

export default upsertNovelChunks;
