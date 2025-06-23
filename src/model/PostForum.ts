import { Schema, Document, models, model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IForumPost extends Document {
  id: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  novelId?: Schema.Types.ObjectId;
  title: string;
  content: string;
  replies: string[];
  createdAt: Date;
  updatedAt: Date;

}

const ForumPostSchema = new Schema<IForumPost>({
  _id: { type: Schema.Types.ObjectId, auto: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  novelId: { type: Schema.Types.ObjectId, ref: 'Novel', required: false },
  title: { type: String, required: true },
  content: { type: String, required: true },
  replies: [{ type: String, ref: 'Comment' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

ForumPostSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export const ForumPost = models.ForumPost || model<IForumPost>('ForumPost', ForumPostSchema,'ForumPost');
