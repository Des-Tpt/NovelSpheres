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
        _id: Schema.Types.ObjectId;
        username: string;
        role: string;
    };
    likes: {
        count: number;
        userIds: Schema.Types.ObjectId[];
    };
    createdAt: Date;
    isDeleted: boolean;
}

const CommentSchema = new Schema<IComment>({
    _id: { type: Schema.Types.ObjectId, auto: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'Comment', default: null },
    replyToUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    sourceType: {
        type: Schema.Types.String,
        enum: ['ForumPost', 'NovelChapter', 'Novel'],
        required: true
    },
    sourceId: {
        type: Schema.Types.ObjectId,
        required: true
    },
    likes: {
        count: { type: Schema.Types.Number, default: 0 },
        userIds: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }]
    },
    createdAt: { type: Date, default: Date.now },
    isDeleted: { type: Schema.Types.Boolean, default: false }
});

CommentSchema.post('save', async function (doc) {
    try {
        if (doc.sourceType === 'ForumPost') {
            const { ForumPost } = require('./PostForum');

            await ForumPost.findByIdAndUpdate(doc.sourceId, {
                lastCommentAt: new Date()
            });
        }
    } catch (error) {
        console.error('Error updating lastCommentAt:', error);
    }
})

CommentSchema.index({ sourceId: 1 });

export const Comment = models.Comment || model<IComment>('Comment', CommentSchema, 'Comment');
