import mongoose, { Schema, Document, models, model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Chapter } from './Chapter';

export interface IAct extends Document {
    _id: Schema.Types.ObjectId,
    novelId: Schema.Types.ObjectId,
    title: String,
    actType: string,
    actNumber: Number,
    createdAt: Date,
    publicId: string,
    format: string,
}

const ActSchema = new Schema<IAct>({
    _id: { type: Schema.Types.ObjectId, auto: true },
    novelId: { type: Schema.Types.ObjectId, ref: 'Novel', required: true },
    title: { type: Schema.Types.String, required: true },
    actNumber: { type: Schema.Types.Number, required: true },
    actType: { type: Schema.Types.String, required: false },
    createdAt: { type: Schema.Types.Date, default: Date.now },
    publicId: { type: Schema.Types.String, required: false },
    format: { type: Schema.Types.String, required: false }
})

ActSchema.index({ novelId: 1, actNumber: 1 });

ActSchema.pre('findOneAndDelete', async function (next) {
    const actId = this.getQuery()._id;

    await Promise.all([
        Chapter.deleteMany({ actId: actId }),
    ]);

    next();
});

export const Act = models.Act || model<IAct>('Act', ActSchema, 'Act');

