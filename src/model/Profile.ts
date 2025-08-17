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
    },
    { timestamps: true }
);

ProfileSchema.index({ userId: 1 });

ProfileSchema.post("save", async function (doc) {
    if (!doc) return doc;
    if (doc.bio) {
        await User.findByIdAndUpdate(doc.userId, { bio: doc.bio });
    }
});

export const Profile = models.Profile || model<IProfile>("Profile", ProfileSchema, "Profile");
