import { Schema, Document, models, model } from 'mongoose';

export interface IReadingHistory extends Document {
    _id: Schema.Types.ObjectId;
    userId: Schema.Types.ObjectId;
    novelId: Schema.Types.ObjectId;
    chapterId: Schema.Types.ObjectId;
    lastReadAt: Date;
}
  
const ReadingHistorySchema = new Schema<IReadingHistory>({
    _id: { type: Schema.Types.ObjectId, auto: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    novelId: { type: Schema.Types.ObjectId, ref: 'Novel', required: true },
    chapterId: { type: Schema.Types.ObjectId, ref: 'Chapter', required: true },
    lastReadAt: { type: Date, default: Date.now }
});
  
export const History = models.ReadingHistory || model<IReadingHistory>('ReadingHistory', ReadingHistorySchema, 'ReadingHistory');
  