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
        bio: { type: Schema.Types.String, maxlength: 1000 },
        socials: {
            facebook: Schema.Types.String,
            twitter: Schema.Types.String,
            discord: Schema.Types.String,
            website: Schema.Types.String,
        },
        stats: {
            followers: { type: Schema.Types.Number, default: 0 },
            following: { type: Schema.Types.Number, default: 0 },
            totalViews: { type: Schema.Types.Number, default: 0 },
            totalNovels: { type: Schema.Types.Number, default: 0 },
        },
        birthday: { type: Date },
        occupation: Schema.Types.String,
        favorites: Schema.Types.String,
        coverImage: {
            publicId: { type: Schema.Types.String, require: false },
            format: { type: Schema.Types.String, require: false },
        }
    },
    { timestamps: true }
);

ProfileSchema.index({ userId: 1 });

export const Profile = models.Profile || model<IProfile>("Profile", ProfileSchema, "Profile");
