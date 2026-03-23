import { NextRequest } from 'next/server';

// Buộc Next.js không cache/buffer response — cần cho streaming
export const dynamic = 'force-dynamic';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'darkfantasy';

// const DEFAULT_SYSTEM_PROMPT = `Bạn là một tiểu thuyết gia Dark Fantasy.
// Nhiệm vụ: Viết DUY NHẤT 1 ĐOẠN VĂN miêu tả diễn biến vật lý tiếp theo.
// Luật:
// 1. CHỈ sử dụng nhân vật có trong bối cảnh.
// 2. Tuyệt đối không có hội thoại, không có suy nghĩ.
// 3. Miêu tả trực diện máu, bùn, hành động né tránh và phản công.`;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            prompt,
            model = process.env.OLLAMA_MODEL || 'darkfantasy-qwen',
            temperature,
            num_predict,
        } = body;

        if (!prompt || prompt.trim().length === 0) {
            return Response.json(
                { error: 'Prompt không được để trống' },
                { status: 400 }
            );
        }

        const options: any = {};
        if (temperature !== undefined) options.temperature = temperature;
        if (num_predict !== undefined) options.num_predict = num_predict;

        const ollamaResponse = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model,
                prompt,
                stream: true,
                ...(Object.keys(options).length > 0 && { options }),
            }),
        });

        if (!ollamaResponse.ok) {
            const errorText = await ollamaResponse.text();
            console.error('Ollama error:', errorText);
            return Response.json(
                { error: `Ollama error: ${ollamaResponse.status} — ${errorText}` },
                { status: 502 }
            );
        }

        if (!ollamaResponse.body) {
            return Response.json(
                { error: 'Ollama không trả về stream' },
                { status: 502 }
            );
        }

        // Chuyển NDJSON stream từ Ollama → text stream cho client
        const reader = ollamaResponse.body.getReader();
        const decoder = new TextDecoder();

        const stream = new ReadableStream({
            async start(controller) {
                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        const chunk = decoder.decode(value, { stream: true });
                        // Ollama trả về NDJSON: mỗi dòng là 1 JSON object
                        const lines = chunk.split('\n').filter(line => line.trim());

                        for (const line of lines) {
                            try {
                                const json = JSON.parse(line);
                                if (json.response) {
                                    // Gửi chỉ phần text cho client
                                    controller.enqueue(
                                        new TextEncoder().encode(json.response)
                                    );
                                }
                                if (json.done) {
                                    controller.close();
                                    return;
                                }
                            } catch {
                                // Skip dòng JSON không parse được
                            }
                        }
                    }
                    controller.close();
                } catch (err) {
                    controller.error(err);
                }
            },
            cancel() {
                reader.cancel();
            },
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream; charset=utf-8',
                'Cache-Control': 'no-cache, no-store, no-transform',
                'Connection': 'keep-alive',
                'X-Accel-Buffering': 'no',
            },
        });
    } catch (error: any) {
        // Bắt lỗi kết nối (Ollama chưa chạy)
        if (error?.cause?.code === 'ECONNREFUSED' || error?.message?.includes('fetch failed')) {
            return Response.json(
                { error: 'Không thể kết nối tới Ollama. Hãy chắc chắn Ollama đang chạy trên máy local.' },
                { status: 503 }
            );
        }
        console.error('AI generate error:', error);
        return Response.json(
            { error: 'Lỗi server: ' + (error?.message || 'Unknown') },
            { status: 500 }
        );
    }
}

// Health check — kiểm tra Ollama có đang chạy không
export async function GET() {
    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
            signal: AbortSignal.timeout(3000),
        });

        if (!response.ok) {
            return Response.json({ status: 'error', message: 'Ollama không phản hồi' }, { status: 502 });
        }

        const data = await response.json();
        const models = data.models?.map((m: any) => m.name) || [];
        const hasModel = models.some((name: string) => name.startsWith(OLLAMA_MODEL));

        return Response.json({
            status: 'connected',
            models,
            activeModel: OLLAMA_MODEL,
            modelAvailable: hasModel,
        });
    } catch {
        return Response.json(
            { status: 'disconnected', message: 'Ollama chưa chạy' },
            { status: 503 }
        );
    }
}
