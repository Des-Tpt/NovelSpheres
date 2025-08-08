import { Schema, Document, models, model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IAct extends Document {
    _id: Schema.Types.ObjectId,
    novelId: Schema.Types.ObjectId,
    title: String,
    actNumber: String,
    createdAt: Date,
    publicId: string,
    format: string,
}

const ActSchema = new Schema<IAct>({
    _id: { type: Schema.Types.ObjectId, auto: true },
    novelId: { type: Schema.Types.ObjectId, ref: 'Novel', required: true },
    title: { type: String, required: true },
    actNumber: {type: String, required: true},
    createdAt: { type: Date, default: Date.now },
    publicId: { type: String, required: false},
    format: {type: String, required: false}
})

ActSchema.index({ novelId: 1, actNumber: 1});

export const Act = models.Act || model<IAct>('Act', ActSchema, 'Act');

