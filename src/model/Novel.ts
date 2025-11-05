import mongoose, { Schema, Document, models, model } from 'mongoose';

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
    views: number;
    likes: number;
    rating: number;
    ratingsCount: number;
    createdAt: Date,
    updatedAt: Date,
}

const NovelSchema = new Schema<INovel>({
    _id: { type: Schema.Types.ObjectId, auto: true },
    title: { type: String, required: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User' },
    description: { type: Schema.Types.String, required: true },
    coverImage: {
        publicId: Schema.Types.String,
        format: Schema.Types.String,
    },
    genresId: { type: [Schema.Types.ObjectId], ref: 'Genre' },
    status: { type: Schema.Types.String, enum: ['Ongoing', 'Completed', 'Hiatus'], default: 'Ongoing' },
    views: { type: Schema.Types.Number, default: 0 },
    likes: { type: Schema.Types.Number, default: 0 },
    rating: { type: Schema.Types.Number, default: 0 },
    ratingsCount: { type: Schema.Types.Number, default: 0 },
    createdAt: { type: Schema.Types.Date, default: new Date() },
    updatedAt: { type: Schema.Types.Date, default: new Date() },
})

NovelSchema.index({ title: 1 });
NovelSchema.index({ genresId: 1 });
NovelSchema.index({ status: 1 });
NovelSchema.index({ views: -1 });

NovelSchema.pre('save', async function () {
    this.updatedAt = new Date();
});

NovelSchema.pre('findOneAndDelete', async function () {
    const novelId = this.getQuery()._id;

    await Promise.all([
        mongoose.model('Act').deleteMany({ novelId }),
        mongoose.model('Chapter').deleteMany({ novelId }),
        mongoose.model('Comment').deleteMany({ sourceType: 'Novel', sourceId: novelId }),
        mongoose.model('Rating').deleteMany({ novelId }),
    ]);
});

export const Novel = models.Novel || model<INovel>('Novel', NovelSchema, 'Novel');