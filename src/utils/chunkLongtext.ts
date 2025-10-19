function chunkText(text: string, maxTokens = 800): string[] {
    // Sử dụng tokenizer thực (hoặc ước lượng an toàn hơn)
    const sentences = text.split(/(?<=[.!?])\s+/);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
        const testChunk = currentChunk + sentence + ' ';
        const estimatedTokens = testChunk.split(/\s+/).length * 1.3;

        if (estimatedTokens > maxTokens) {
            if (currentChunk.trim()) {
                chunks.push(currentChunk.trim());
            }
            currentChunk = sentence + ' ';
        } else {
            currentChunk = testChunk;
        }
    }

    if (currentChunk.trim()) chunks.push(currentChunk.trim());

    return chunks;
}

export default chunkText;