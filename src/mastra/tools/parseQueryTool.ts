import { createTool } from '@mastra/core';
import { z } from 'zod';
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';

export const parseQueryTool = createTool({
    id: 'parse-user-query',
    description: 'Phân tích yêu cầu của người dùng và trích xuất ra theo mẫu metaData.',
    inputSchema: z.object({
        query: z.string().describe('Yêu cầu của người dùng cần phân tích'),
    }),
    outputSchema: z.object({
        originalQuery: z.string(),
        metadata: z.object({
            query: z.string().describe('Yêu cầu chính'),
            titleNovel: z.string().optional().describe('Tên tiểu thuyết đã được đề cập'),
            character: z.array(z.string()).optional().describe('Tên nhân vật đã được đề cập'),
            actTitle: z.string().optional().describe('Tên act đã được đề cập'),
            actNumber: z.number().optional().describe('Act số...'),
            chapterTitle: z.string().optional().describe('Tên chương đã được đề cập'),
            chapterNumber: z.number().optional().describe('Số của chương đã được đề cập'),
            type: z.string().describe('Dạng câu hỏi'),
        }),
    }),
    execute: async ({ context: { query } }) => {
        try {
            return await analyseQuery(query);
        } catch (error) {
            console.error('Error parsing query:', error);
            return {
                originalQuery: query,
                metadata: {
                    query: query,
                    type: "Search",
                },
            };
        }
    },
});

async function analyseQuery(query: string) {
    const { object } = await generateObject({
        model: google('gemini-2.0-flash-exp'),
        schema: z.object({
            query: z.string().describe('Yêu cầu'),
            titleNovel: z.string().optional().describe('Tên truyện'),
            character: z.array(z.string()).optional().describe('Tên nhân vật được đề cập'),
            actNumber: z.number().optional().describe('Act số...'),
            actTitle: z.string().optional().describe('Tên act'),
            chapterTitle: z.string().optional().describe('Tên truyện'),
            chapterNumber: z.number().optional().describe('Chương số...'),
            type: z.string().describe('Dạng câu hỏi')
        }),
        prompt: `Phân tích câu hỏi của người dùng và trích xuất thông tin có cấu trúc:

                Câu hỏi: "${query}"

                Trích xuất:
                - query: Câu truy vấn đã làm sạch, tinh gọn (bỏ từ thừa, giữ thông tin quan trọng)
                - titleNovel: Tên truyện nếu được đề cập (ví dụ: "Conan", "Thất Hình Đại Tội")
                - character: Mảng tên nhân vật được đề cập (ví dụ: ["Luffy", "Zoro"])
                - actTitle: Tên hồi/arc nếu được đề cập                
                - actNumber: Số của act nếu được đề cập (dạng số)
                - chapterTitle: Tên chương nếu được đề cập
                - chapterNumber: Số của chương nếu được đề cập (dạng số)
                - type: chỉ dạng câu hỏi, là yêu cầu tìm chương hay là tìm nội dung. Chỉ trả về 2 kiểu (Summarize hoặc Search)

                Nếu không được đề cập, trả về undefined cho field đó.
                Hãy thông minh với ngữ cảnh - ví dụ "chương 5" hoặc "chap 5" nên trích xuất chapterNumber: 5.

                Ví dụ:
                Input: "Lorius làm gì ở chương 5 của arc "Khi mọi thứ bắt đầu"?"
                Output: {
                    query: "Lorius làm gì ở chương 5",
                    character: ["Lorius"],
                    actTitle: "Khi mọi thứ bắt đầu",
                    chapterNumber: 5,
                    type: "Summarize"
                }

                Input: "Lorius đã đánh nhau với Orc Champion ở chương mấy?"
                Output: {
                    query: "Lorius đã đánh nhau với Orc Champion ở chương mấy?",
                    type: "Search"
                }

                Input: "Tóm tắt chương 5 của tiểu thuyết "Khi mọi thứ bắt đầu"?"
                Output: {
                    query: "Tóm tắt chương 5",
                    titleNovel: "Khi mọi thứ bắt đầu",
                    chapterNumber: 5,
                    type: "Summarize"
                }`,
    });

    return {
        originalQuery: query,
        metadata: object,
    };
} 