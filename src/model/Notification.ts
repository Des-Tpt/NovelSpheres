import { Schema, Document, model, models } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface INotification extends Document {
  _id: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  type: 'chapter_update' | 'comment_reply' | 'follow_update';
  message: string;
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  _id: { type: Schema.Types.ObjectId, auto: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['chapter_update', 'comment_reply', 'follow_update'], required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

NotificationSchema.index({createdAt: 1});

export const Notification = models.Notification || model<INotification>('Notification', NotificationSchema, 'Notification');
