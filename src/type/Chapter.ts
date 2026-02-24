export interface Chapter {
    _id: string,
    novelId: string,
    actId: string,
    title: string,
    content: string,
    chapterNumber: number,
    wordCount: number,
    updatedAt: Date,
    createdAt: Date
}