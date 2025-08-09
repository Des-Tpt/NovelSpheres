import { Schema, Document, models, model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IChapter extends Document {
    _id: Schema.Types.ObjectId,
    novelId: Schema.Types.ObjectId,
    actId: Schema.Types.ObjectId,
    title: String,
    content: String,
    chapterNumber: Number,
    wordCount: Number,
    updatedAt: Date,
    createdAt: Date
}

const ChapterSchema = new Schema<IChapter>({
    _id: { type: Schema.Types.ObjectId, auto: true },
    novelId: { type: Schema.Types.ObjectId, ref: 'Novel', required: true },
    actId: { type: Schema.Types.ObjectId, ref: 'Act', required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    chapterNumber: { type: Number, required: true },
    wordCount: {type: Number},
    updatedAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
})

ChapterSchema.index({ novelId: 1, chapterNumber: 1 });
ChapterSchema.index({ actId: 1 });

ChapterSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
  });
  

export const Chapter = models.Chapter || model<IChapter>('Chapter', ChapterSchema, 'Chapter');
