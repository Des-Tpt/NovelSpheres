import mongoose, { Schema, Document, models, model, Number } from 'mongoose';
import { Comment } from './Comment';

export type PostType = 'general' | 'reviews' | 'recommendations' | 'ask-author' | 'writing' | 'support';

export interface IForumPost extends Document {
    _id: Schema.Types.ObjectId;
    userId: Schema.Types.ObjectId;
    novelId?: Schema.Types.ObjectId;
    title: string;
    category: PostType;
    isLocked: boolean;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    views: number;
    lastCommentAt: Date;
}

const ForumPostSchema = new Schema<IForumPost>({
    _id: { type: Schema.Types.ObjectId, auto: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    novelId: { type: Schema.Types.ObjectId, ref: 'Novel', required: false },
    title: { type: Schema.Types.String, required: true },
    category: { type: Schema.Types.String, enum: ['general', 'reviews', 'recommendations', 'ask-author', 'writing', 'support'], default: 'general', required: true },
    content: { type: Schema.Types.String, required: true },
    isLocked: { type: Schema.Types.Boolean, default: false },
    createdAt: { type: Schema.Types.Date, default: Date.now },
    updatedAt: { type: Schema.Types.Date, default: Date.now },
    views: { type: Schema.Types.Number, default: 0 },
    lastCommentAt: {
        type: Schema.Types.Date,
        default:
            function () {
                return this.createdAt || new Date()
            }
    },
});

ForumPostSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

ForumPostSchema.index({ lastCommentAt: -1 });
ForumPostSchema.index({ category: 1, lastCommentAt: -1 });

ForumPostSchema.pre('findOneAndDelete', async function (next) {
    const postId = this.getQuery()._id;

    await Promise.all([
        mongoose.model('Comment').deleteMany({ sourceType: 'PostForum', sourceId: postId }),
    ]);

    next();
});

ForumPostSchema.pre('findOneAndDelete', async function (next) {
    const postId = this.getQuery()._id;

    try {
        await Comment.deleteMany({
            sourceType: 'ForumPost',
            sourceId: postId
        });

        next();
    } catch (error) {
        console.error('Error deleting comments:', error);
        next(error as mongoose.CallbackError);
    }
});


export const ForumPost = models.ForumPost || model<IForumPost>('ForumPost', ForumPostSchema, 'ForumPost');
