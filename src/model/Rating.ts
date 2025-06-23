import { Schema, Document, models, model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IRating extends Document {
    _id: Schema.Types.ObjectId;
    userId: string;
    novelId: string;
    score: number;
    createdAt: Date;
}
  
const RatingSchema = new Schema<IRating>({
    _id: { type: Schema.Types.ObjectId, auto: true },
    userId: { type: String, ref: 'User', required: true },
    novelId: { type: String, ref: 'Novel', required: true },
    score: { type: Number, min: 1, max: 5, required: true },
    createdAt: { type: Date, default: Date.now }
});
  
export const Rating = models.Rating || model<IRating>('Rating', RatingSchema, 'Rating');
  