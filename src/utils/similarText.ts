function textToVector(text: string): Record<string, number> {
    const words = text
        .toLowerCase()
        .replace(/[^a-z0-9\sàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/g, '')
        .split(/\s+/)
        .filter(Boolean);

    const vector: Record<string, number> = {};
    for (const w of words) {
        vector[w] = (vector[w] || 0) + 1;
    }
    return vector;
}

function cosineSimilarity(vecA: Record<string, number>, vecB: Record<string, number>): number {
    const allWords = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
    let dot = 0, magA = 0, magB = 0;

    for (const word of allWords) {
        const a = vecA[word] || 0;
        const b = vecB[word] || 0;
        dot += a * b;
        magA += a * a;
        magB += b * b;
    }

    return magA && magB ? dot / (Math.sqrt(magA) * Math.sqrt(magB)) : 0;
}

export function textSimilarity(text1: string, text2: string): number {
    const vecA = textToVector(text1);
    const vecB = textToVector(text2);
    return cosineSimilarity(vecA, vecB);
}
