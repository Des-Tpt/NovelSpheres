import { Schema, Document, models, model } from 'mongoose';
import { Novel } from './Novel';

export interface IRating extends Document {
    _id: Schema.Types.ObjectId;
    userId: Schema.Types.ObjectId;
    novelId: Schema.Types.ObjectId;
    score: number;
    createdAt: Date;
}

const RatingSchema = new Schema<IRating>({
    _id: { type: Schema.Types.ObjectId, auto: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    novelId: { type: Schema.Types.ObjectId, ref: 'Novel', required: true },
    score: { type: Number, min: 1, max: 5, required: true },
    createdAt: { type: Date, default: Date.now }
});

RatingSchema.index({ userId: 1 });
RatingSchema.index({ novelId: 1 });

// Function để update novel stats
async function updateNovelStats(novelId: Schema.Types.ObjectId) {
    console.log('🎯 Updating novel stats for:', novelId);
    
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

        console.log('📊 Aggregation result:', stats);

        if (stats.length > 0) {
            const result = await Novel.findByIdAndUpdate(
                novelId,
                {
                    rating: Math.round(stats[0].averageScore * 100) / 100, // 2 decimal places
                    ratingsCount: stats[0].totalRatings
                },
                { new: true }
            );
            console.log('✅ Novel updated successfully:', {
                id: result?._id,
                rating: result?.rating,
                ratingsCount: result?.ratingsCount
            });
        } else {
            // Reset nếu không còn rating nào
            const result = await Novel.findByIdAndUpdate(
                novelId,
                { rating: 0, ratingsCount: 0 },
                { new: true }
            );
            console.log('🔄 Novel stats reset to 0:', result?._id);
        }
    } catch (error) {
        console.error('❌ Error updating novel stats:', error);
    }
}

// Hook sau khi tạo mới rating
RatingSchema.post('save', async function (doc) {
    console.log('🔥 Post save hook triggered for:', doc._id);
    await updateNovelStats(doc.novelId);
});

// Hook sau khi update rating (chỉ 1 hook duy nhất!)
RatingSchema.post('findOneAndUpdate', async function (doc) {
    console.log('🔥 Post findOneAndUpdate hook triggered');
    
    if (doc) {
        console.log('📄 Updated document:', doc._id, 'Score:', doc.score);
        await updateNovelStats(doc.novelId);
    } else {
        console.log('❌ No document returned from findOneAndUpdate');
    }
});

// Hook sau khi xóa rating
RatingSchema.post('findOneAndDelete', async function (doc) {
    console.log('🔥 Post delete hook triggered');
    
    if (doc) {
        console.log('🗑️ Deleted rating:', doc._id);
        await updateNovelStats(doc.novelId);
    }
});


export const Rating = models.Rating || model<IRating>('Rating', RatingSchema, 'Rating');