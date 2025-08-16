import { Schema, Document, model, models } from 'mongoose';
import { Novel } from './Novel';
import { Profile } from './Profile';

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

LikesSchema.post('save', async function (doc) {
    const count = await Likes.countDocuments({ novelId: doc.novelId });
    await Novel.findByIdAndUpdate(doc.novelId, { likes: count });

    await Profile.findOneAndUpdate(
        { userId: doc.userId },
        { $addToSet: { favorites: doc._id } }
    );

});

LikesSchema.post('findOneAndDelete', async function (doc) {
    if (doc) {
        const count = await Likes.countDocuments({ novelId: doc.novelId });
        await Novel.findByIdAndUpdate(doc.novelId, { likes: count });
        
        await Profile.findOneAndUpdate(
            { userId: doc.userId },
            { $pull: { favorites: doc._id } }
        );
    }
});

export const Likes = models.Likes || model<ILikeSchema>('Likes', LikesSchema, 'Likes');
