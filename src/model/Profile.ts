import { Document, Schema, model, models } from "mongoose";
import { User } from "./User";

export interface IProfile extends Document {
    userId: Schema.Types.ObjectId;
    bio: string;
    socials: {
        facebook: string,
        twitter: string,
        discord: string,
        website: string,
    },
    stats: {
        followers: number,
        following: number,
        totalViews: number,
        totalNovels: number,
    },
    birthday: Date,
    occupation: string,
    favorites: string,
    coverImage?: {
        publicId: string,
        format: string,
    }
}

const ProfileSchema = new Schema<IProfile>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        bio: { type: String, maxlength: 1000 },
        socials: {
            facebook: String,
            twitter: String,
            discord: String,
            website: String,
        },
        stats: {
            followers: { type: Number, default: 0 },
            following: { type: Number, default: 0 },
            totalViews: { type: Number, default: 0 },
            totalNovels: { type: Number, default: 0 },
        },
        birthday: { type: Date },
        occupation: String,
        favorites: String,
        coverImage: {
            publicId: { type: String, require: false },
            format: { type: String, require: false },
        }
    },
    { timestamps: true }
);

ProfileSchema.index({ userId: 1 });

export const Profile = models.Profile || model<IProfile>("Profile", ProfileSchema, "Profile");
