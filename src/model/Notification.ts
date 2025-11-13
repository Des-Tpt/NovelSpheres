import { Schema, Document, model, models } from 'mongoose';

export interface INotification extends Document {
  _id: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  type: 'chapter_update' | 'comment_reply' | 'follow_update';
  message: string;
  href: string;
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  _id: { type: Schema.Types.ObjectId, auto: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: Schema.Types.String, enum: ['chapter_update', 'comment_reply', 'follow_update', 'new_ratings'], required: true },
  message: { type: Schema.Types.String, required: true },
  href: { type: Schema.Types.String, required: true },
  isRead: { type: Schema.Types.Boolean, default: false },
  createdAt: { type: Schema.Types.Date, default: Date.now }
});

NotificationSchema.index({ userId: 1, createdAt: -1 });

export const Notification = models.Notification || model<INotification>('Notification', NotificationSchema, 'Notification');
