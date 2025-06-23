import { Schema, Document, model, models } from 'mongoose';


export interface IUserFavorite extends Document {
    _id: Schema.Types.ObjectId;
    userId: string;
    novelId: string;
    createdAt: Date;
    }
  
const UserFavoritesSchema = new Schema<IUserFavorite>({
    _id: { type: Schema.Types.ObjectId, auto: true },
    userId: { type: String, ref: 'User', required: true },
    novelId: { type: String, ref: 'Novel', required: true },
    createdAt: { type: Date, default: Date.now }
    });
  
export const UserFavorite = models.UserFavorite || model<IUserFavorite>('UserFavorite', UserFavoritesSchema, 'UserFavorite');
  