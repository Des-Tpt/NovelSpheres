import { Schema, Document, models, model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface INovel extends Document {
    _id: Schema.Types.ObjectId,
    title: String,
    authorId: String,
    description: String,
    coverImage?: {
        publicId?: string,
        format?: string,
    },
    genresId: [Schema.Types.ObjectId],
    status: 'Ongoing' | 'Completed' | 'Hiatus',
    views: Number;
    rating: Number;
    createdAt: Date,
    updatedAt: Date
}

const NovelSchema = new Schema<INovel>({
    _id: {type: Schema.Types.ObjectId, auto: true},
    title: {type: String, required: true},
    authorId: { type: Schema.Types.ObjectId, ref: 'User' },
    description: {type: String, required: true},
    coverImage: {
        publicId: String,
        format: String,
    },
    genresId: {type: [Schema.Types.ObjectId], ref: 'Genre' },
    status: { type: String, enum: ['Ongoing', 'Completed', 'Hiatus'], default: 'Ongoing' },
    views: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    createdAt: Date,
    updatedAt: Date
})

NovelSchema.index({ title: 1 });
NovelSchema.index({ genresId: 1 }); 
NovelSchema.index({ status: 1 });
NovelSchema.index({ views: -1 });

NovelSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
  });  

export const Novel = models.Novel || model<INovel>('Novel', NovelSchema, 'Novel');