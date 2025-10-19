import { Agent } from "@mastra/core/agent";
import { ModerationProcessor } from "@mastra/core/processors";
import { google } from "@ai-sdk/google";
import { LibSQLStore } from "@mastra/libsql";
import { Memory } from '@mastra/memory';

export const NovelSphereAgents = new Agent({
    name: "NovelSphereAgents",
    description: "Agent for NovelSphere application",
    model: google("gemini-2.5-flash"),
    instructions: [
        {
            role: "system",
            content: 
            `Bạn là một trợ lý thông minh chuyên phân tích câu hỏi người dùng. Nhiệm vụ của bạn:
                1. Nhận câu hỏi từ người dùng.
                2. Phân tích câu hỏi và tạo ra metadata phù hợp để phục vụ tìm kiếm vector. Metadata nên bao gồm:
                - Chủ đề chính
                - Từ khóa quan trọng
                - Các thuộc tính bổ trợ nếu cần
                3. Sử dụng metadata đó gọi công cụ tìm kiếm vector để tìm dữ liệu liên quan nhất.
                4. Tổng hợp dữ liệu tìm được và tạo ra câu trả lời chính xác, súc tích cho người dùng.
                5. Nếu dữ liệu không đủ, thông báo rõ ràng rằng bạn không tìm thấy câu trả lời.
                6. Trả kết quả cuối cùng cho người dùng, không hiển thị metadata nội bộ.

                Luôn nhớ:
                - Metadata là để agent sử dụng nội bộ, không cần đưa vào câu trả lời.
                - Hãy giữ giọng văn thân thiện, súc tích, nhưng vẫn chuyên nghiệp.
            `
        },
        {
            role: "system",
            content: "Hãy trả lời câu hỏi của tôi một cách ngắn gọn và súc tích nhất có thể"
        },
    ],
    inputProcessors: [
        new ModerationProcessor({
            model: google("gemini-1.5-flash"),
            categories: ["HATE_SPEECH", "SEXUALLY_EXPLICIT", "VIOLENCE", "SELF_HARM", "OUT_OF_SCOPE"],
            threshold: 0.7,
            strategy: "block",
            instructions:
                `Bạn là một bộ lọc nội dung. Nhiệm vụ của bạn là đánh giá xem nội dung đầu vào có vi phạm các quy tắc cộng đồng hay không,
                đồng thời không trả lời các câu hỏi đi quá xa khỏi chủ đề chính là tiểu thuyết và cách viết tiểu thuyết. 
                Nếu vi phạm, hãy từ chối xử lý và thông báo lỗi phù hợp.`,
            includeScores: true,
            chunkWindow: 1,
        })
    ],
    memory: new Memory({
        storage: new LibSQLStore({
            url: 'file:../mastra.db',
        }),
    }),

})