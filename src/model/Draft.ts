import { Schema, Document, models, model } from 'mongoose';
import { Novel } from './Novel';

export interface IDraft extends Document {
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

const DraftSchema = new Schema<IDraft>({
    _id: { type: Schema.Types.ObjectId, auto: true },
    novelId: { type: Schema.Types.ObjectId, ref: 'Novel', required: true },
    actId: { type: Schema.Types.ObjectId, ref: 'Act', required: true },
    title: { type: Schema.Types.String, required: true },
    content: { type: Schema.Types.String, required: true },
    chapterNumber: { type: Schema.Types.Number, required: true },
    wordCount: { type: Schema.Types.Number },
    updatedAt: { type: Schema.Types.Date, default: Date.now },
    createdAt: { type: Schema.Types.Date, default: Date.now }
})

DraftSchema.index({ novelId: 1, chapterNumber: 1 });
DraftSchema.index({ actId: 1 });

DraftSchema.pre('save', async function (next) {
    this.updatedAt = new Date();

    if (this.novelId) {
        await Novel.findByIdAndUpdate(this.novelId,
            { updatedAt: new Date() }
        );
    }
    next();
});


export const Draft = models.Draft || model<IDraft>('Draft', DraftSchema, 'Draft');
