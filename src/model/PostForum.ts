import { Schema, Document, models, model, Number } from 'mongoose';

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
}

const ForumPostSchema = new Schema<IForumPost>({
  _id: { type: Schema.Types.ObjectId, auto: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  novelId: { type: Schema.Types.ObjectId, ref: 'Novel', required: false },
  title: { type: String, required: true },
  category: {type: String, enum: ['general', 'reviews', 'recommendations', 'ask-author', 'writing', 'support'], default: 'general', required: true },
  content: { type: String, required: true },
  isLocked: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  views: {type: Schema.Types.Number, default: 0}
});

ForumPostSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export const ForumPost = models.ForumPost || model<IForumPost>('ForumPost', ForumPostSchema,'ForumPost');
