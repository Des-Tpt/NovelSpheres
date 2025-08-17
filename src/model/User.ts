import mongoose, { Schema, Document, models, model } from 'mongoose';
import { Profile } from './Profile';

export interface IUser extends Document {
  _id: Schema.Types.ObjectId;
  username: string;
  email: string;
  password: string;
  role: 'reader' | 'admin' | 'writer';
  profile?: {
    profileId?: string;
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
    profileId: { type: Schema.Types.ObjectId, require: false, ref: 'Profile' },
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

UserSchema.post('save', async function (doc) {
  if (doc.isNew) {
    await Profile.create({
      userId: doc._id,
      bio: "",
      socials: {},
      stats: {
        followers: 0,
        following: 0,
        totalViews: 0,
        totalNovels: 0,
      },
    });
  }
});

export const User = models.User || model<IUser>('User', UserSchema, 'User');