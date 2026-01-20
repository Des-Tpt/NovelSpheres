export interface Chapter {
    _id: string,
    novelId: string,
    actId: string,
    title: String,
    content: String,
    chapterNumber: Number,
    wordCount: Number,
    updatedAt: Date,
    createdAt: Date
}