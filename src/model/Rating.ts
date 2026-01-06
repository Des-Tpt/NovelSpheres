import { Schema, Document, models, model } from 'mongoose';
import { Novel } from './Novel';

export interface IRating extends Document {
    _id: Schema.Types.ObjectId;
    userId: Schema.Types.ObjectId;
    novelId: Schema.Types.ObjectId;
    score: number;
    rate: string;
    likes: {
        count: number;
        userIds: string[];
    };
    dislikes: {
        count: number;
        userIds: string[];
    };
    createdAt: Date;
}

const RatingSchema = new Schema<IRating>({
    _id: { type: Schema.Types.ObjectId, auto: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    novelId: { type: Schema.Types.ObjectId, ref: 'Novel', required: true },
    score: { type: Schema.Types.Number, min: 1, max: 5, required: true },
    rate: { type: Schema.Types.String, default: ' ' },
    likes: {
        count: { type: Schema.Types.Number, default: 0 },
        userIds: { type: [String], default: [] }
    },
    dislikes: {
        count: { type: Schema.Types.Number, default: 0 },
        userIds: { type: [String], default: [] }
    },
    createdAt: { type: Schema.Types.Date, default: Date.now }
});

RatingSchema.index({ userId: 1 });
RatingSchema.index({ novelId: 1 });

// Function để update novel stats
async function updateNovelStats(novelId: Schema.Types.ObjectId) {
    try {
        const stats = await Rating.aggregate([
            { $match: { novelId: novelId } },
            {
                $group: {
                    _id: '$novelId',
                    averageScore: { $avg: '$score' },
                    totalRatings: { $sum: 1 }
                }
            }
        ]);

        if (stats.length > 0) {
            await Novel.findByIdAndUpdate(
                novelId,
                {
                    rating: Math.round(stats[0].averageScore * 100) / 100,
                    ratingsCount: stats[0].totalRatings
                },
                { new: true }
            );
        } else {
            await Novel.findByIdAndUpdate(
                novelId,
                { rating: 0, ratingsCount: 0 },
                { new: true }
            );
        }
    } catch (error) {
        console.error('Error updating novel stats:', error);
    }
}

RatingSchema.post('save', async function (doc) {
    await updateNovelStats(doc.novelId);
});

RatingSchema.post('findOneAndUpdate', async function (doc) {
    if (doc) {
        await updateNovelStats(doc.novelId);
    }
});

RatingSchema.post('findOneAndDelete', async function (doc) {
    if (doc) {
        await updateNovelStats(doc.novelId);
    }
});


export const Rating = models.Rating || model<IRating>('Rating', RatingSchema, 'Rating');