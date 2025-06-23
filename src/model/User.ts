import { Schema, Document, models, model } from 'mongoose';

export interface IUser extends Document {
  _id: Schema.Types.ObjectId;
  username: string;
  email: string;
  password: string;
  role: 'reader' | 'admin' | 'writer';
  profile?: {
    bio?: string;
    avatar?: string;
  };
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  _id: { type: Schema.Types.ObjectId, auto: true },
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['reader', 'writer', 'admin'], default: 'reader' },
  profile: {
    bio: String,
    avatar: String,
  },
  createdAt: { type: Date, default: Date.now },
});

export const User = models.User || model<IUser>('User', UserSchema, 'User');