import { Schema, Document, model, models } from 'mongoose';

export interface IComment extends Document {
    _id: Schema.Types.ObjectId;
    userId: Schema.Types.ObjectId,
    content: string;
    parentId: Schema.Types.ObjectId | null;
    replyToUserId?: string;
    sourceType: 'ForumPost' | 'NovelChapter' | 'Novel';
    sourceId: Schema.Types.ObjectId;
    user?: {
        _id: string;
        username: string;
        role: string;
        profile?: {
            avatar?: {
                publicId: string;
                format: string;
            };
        };
    };
    replyToUser?: {
        _id: string;
        username: string;
        role: string;
    };
    createdAt: Date;
}

const CommentSchema = new Schema<IComment>({
    _id: { type: Schema.Types.ObjectId, auto: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'Comment', default: null },
    replyToUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null }, 
    sourceType: {
        type: String,
        enum: ['ForumPost', 'NovelChapter', 'Novel'],
        required: true
    },
    sourceId: {
        type: Schema.Types.ObjectId,
        required: true
    },
    createdAt: { type: Date, default: Date.now }
});

export const Comment = models.Comment || model<IComment>('Comment', CommentSchema, 'Comment');