import { Schema, Document, model, models } from 'mongoose';
import { Novel } from './Novel';

export interface ILikeSchema extends Document {
    userId: Schema.Types.ObjectId;
    novelId: Schema.Types.ObjectId;
    createdAt: Date;
}

const LikesSchema = new Schema<ILikeSchema>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    novelId: { type: Schema.Types.ObjectId, ref: 'Novel', required: true },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

LikesSchema.index({ userId: 1, novelId: 1 });

LikesSchema.post('save', async function (doc) {
    const count = await Likes.countDocuments({ novelId: doc.novelId });
    await Novel.findByIdAndUpdate(doc.novelId, { likes: count });
});

LikesSchema.post('findOneAndDelete', async function (doc) {
    if (doc) {
        const count = await Likes.countDocuments({ novelId: doc.novelId });
        await Novel.findByIdAndUpdate(doc.novelId, { likes: count });
    }
});

export const Likes = models.Likes || model<ILikeSchema>('Likes', LikesSchema, 'Likes');
