import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { connectDB } from '@/lib/db';
import { Chapter } from '@/model/Chapter';
import { Act } from '@/model/Act';
import { Novel } from '@/model/Novel';
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';

export const searchIdTool = createTool({
    id: 'search-id-from-parseQuery',
    description: "Tìm id của tiểu thuyết, chương, act từ yêu cầu đã đề cặp.",
    inputSchema: z.object({
        originalQuery: z.string(),
        metadata: z.object({
            query: z.string().describe('Yêu cầu chính'),
            titleNovel: z.string().optional().describe('Tên tiểu thuyết đã được đề cập'),
            character: z.array(z.string()).optional().describe('Tên nhân vật đã được đề cập'),
            actTitle: z.string().optional().describe('Tên act đã được đề cập'),
            actNumber: z.number().optional().describe('Số của act đã được đề cập.'),
            chapterTitle: z.string().optional().describe('Tên chương đã được đề cập'),
            chapterNumber: z.number().optional().describe('Số của chương đã được đề cập'),
            type: z.string().describe('Dạng yêu cầu'),
        }),
    }),
    outputSchema: z.object({
        originalQuery: z.string(),
        metadata: z.object({
            query: z.string().describe('Yêu cầu chính'),
            novelId: z.string().optional().describe('Id của tiểu thuyết được đề cặp'),
            character: z.array(z.string()).optional().describe('Tên nhân vật đã được đề cập'),
            actId: z.string().optional().describe('Id của act đã được đề cập'),
            actNumber: z.number().optional().describe('Số của act đã được đề cập'),
            chapterId: z.string().optional().describe('Id của chương đã được đề cập'),
            chapterNumber: z.number().optional().describe('Số của chương đã được đề cập'),
            type: z.string().describe('Dạng yêu cầu'),
        }),
    }),
    execute: async ({ context }) => {
        const { originalQuery, metadata } = context;

        let novel: any, act: any, chapter: any;
        if (metadata.actTitle || metadata.chapterTitle || metadata.titleNovel) {
            await connectDB();

            const queries = [];

            if (metadata.actTitle) {
                queries.push(
                    Act.aggregate([
                        {
                            $search: {
                                index: 'acts-search',
                                query: `${removeVietnameseTones(metadata.actTitle)}`,
                                path: ['title'],
                                fuzzy: {
                                    maxEdit: 2,
                                    prefixLength: 2,
                                }
                            }
                        },
                        {
                            $limit: 3,
                        }
                    ])
                );
            }

            if (metadata.titleNovel) {
                queries.push(
                    Novel.aggregate([
                        {
                            $search: {
                                index: 'novels-search',
                                query: `${removeVietnameseTones(metadata.titleNovel)}`,
                                path: ['title', 'description'],
                                fuzzy: {
                                    maxEdit: 2,
                                    prefixLength: 2,
                                }
                            }
                        },
                        {
                            $limit: 3,
                        }
                    ])
                );
            }

            if (metadata.chapterTitle) {
                queries.push(
                    Chapter.aggregate([
                        {
                            $search: {
                                index: 'chapters-search',
                                query: `${removeVietnameseTones(metadata.chapterTitle)}`,
                                path: ['title'],
                                fuzzy: {
                                    maxEdit: 2,
                                    prefixLength: 2,
                                }
                            }
                        },
                        {
                            $limit: 3,
                        }
                    ])
                );
            }

            const results = await Promise.all(queries);
            let resultIndex = 0;

            if (metadata.actTitle) {
                act = results[resultIndex++];
            }

            if (metadata.titleNovel) {
                novel = results[resultIndex++];
            }

            if (metadata.chapterTitle) {
                chapter = results[resultIndex++];
            }
        }


        let response: any = {
            novelId: undefined,
            chapterId: undefined,
            actId: undefined
        };

        if (novel?.length > 0 || act?.length > 0 || chapter?.length > 0) {
            response = await chooseTheMostResonableId(originalQuery, novel, chapter, act);
        }

        return {
            originalQuery: originalQuery,
            metadata: {
                query: metadata.query,
                novelId: response.novelId || undefined,
                character: metadata.character,
                actId: response.actId || undefined,
                actNumber: metadata.actNumber,
                chapterId: response.chapterId || undefined,
                chapterNumber: metadata.chapterNumber,
                type: metadata.type,
            },
        }
    }
})

async function chooseTheMostResonableId(query: string, novel: any | null, chapter: any | null, act: any | null) {
    const { object } = await generateObject({
        model: google('gemini-2.0-flash-exp'),
        schema: z.object({
            novelId: z.string().optional().describe('NovelId'),
            chapterId: z.string().optional().describe('chapterId'),
            actId: z.string().optional().describe('actId'),
        }),
        prompt: `Dựa vào câu hỏi của người dùng, chọn ID phù hợp nhất từ dữ liệu tìm kiếm.

            Câu hỏi: "${query}"

            Dữ liệu tìm được:
            - Novel: ${novel ? JSON.stringify(novel, null, 2) : 'Không có'}
            - Chapter: ${chapter ? JSON.stringify(chapter, null, 2) : 'Không có'}
            - Act: ${act ? JSON.stringify(act, null, 2) : 'Không có'}

            Hướng dẫn:
            1. So sánh title trong data với thông tin trong câu hỏi
            2. Chỉ trả về ID nếu title khớp ít nhất 70%
            3. Nếu không chắc chắn, bỏ trống field đó
            4. Ưu tiên độ chính xác hơn là đầy đủ

            Ví dụ:
            Câu hỏi: "Trong The Pale War - act End of The Pale, chương 5, Lorius là ai?"
            Data: [{_id: "123", title: "The Pale War"}, {_id: "456", novelId: "123", title: "End of the Pale"}, {_id: "789", novelId: "123", "actId: 456", chapterNumber: 5}]
            => {novelId: "123", actId: "456", chapterId: "789"}`
    });

    return {
        chapterId: object.chapterId,
        actId: object.actId,
        novelId: object.novelId,
    };
}

function removeVietnameseTones(str: string): string {
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D");
}
