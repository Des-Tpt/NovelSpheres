import { Document, Schema, model, models } from "mongoose";

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
        follower: number,
        following: number,
        totalViews: number,
        totalNovels: number,
    },
    favorites: string,
    novelsPosted: string
}

const ProfileSchema = new Schema<IProfile>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        bio: { type: String, maxlength: 500 },
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
        favorites: [{ type: Schema.Types.ObjectId, ref: "Likes" }],
        novelsPosted: [{ type: Schema.Types.ObjectId, ref: "Novel" }],
    },
    { timestamps: true }
);

ProfileSchema.index({ userId: 1 });

export const Profile = models.Profile || model<IProfile>("Profile", ProfileSchema, "Profile");
