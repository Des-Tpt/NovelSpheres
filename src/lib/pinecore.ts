import { Pinecone } from '@pinecone-database/pinecone';

if (!process.env.PINECONE_API_KEY) {
    throw new Error('PINECONE_API_KEY is not defined in environment variables');
}

export const pc = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
});

const indexName = 'novel-chapters';

export const indexNovel = pc.index(indexName);
