import { Schema, Document, model, models } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IComment extends Document {
    _id: Schema.Types.ObjectId;
    postId: Schema.Types.ObjectId;    
    userId: Schema.Types.ObjectId;  
    content: string;
    createdAt: Date;
}

const CommentSchema = new Schema<IComment>({
    _id: { type: Schema.Types.ObjectId, auto: true },
    postId: { type: Schema.Types.ObjectId, ref: 'ForumPost', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

export const Comment = models.Comment || model<IComment>('Comment', CommentSchema, 'Comment');
