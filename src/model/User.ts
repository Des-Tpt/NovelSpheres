import mongoose, { Schema, Document, models, model } from 'mongoose';

export interface IUser extends Document {
  _id: Schema.Types.ObjectId;
  username: string;
  email: string;
  password: string;
  role: 'reader' | 'admin' | 'writer';
  profile?: {
    bio?: string;
    avatar?: {
      publicId: string;
      format: string;
    };
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
    avatar: {
      publicId: { type: String },
      format: { type: String },
    },
  },
  createdAt: { type: Date, default: Date.now },
});

UserSchema.pre('findOneAndDelete', async function (next) {
  const userId = this.getQuery()._id;

  await Promise.all([
    mongoose.model('Novel').deleteMany({ authorId: userId }),
    mongoose.model('ForumPost').deleteMany({ userId: userId }),
    mongoose.model('Comment').deleteMany({ userId: userId }),
    mongoose.model('Rating').deleteMany({ userId: userId }),
    mongoose.model('Notification').deleteMany({ userId: userId }),
  ]);

  next();
});

export const User = models.User || model<IUser>('User', UserSchema, 'User');