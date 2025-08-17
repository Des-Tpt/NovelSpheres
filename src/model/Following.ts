
import { Document, Schema, model, models } from "mongoose";

interface IFollow extends Document {
    followerUserId: Schema.Types.ObjectId,
    followingUserId: Schema.Types.ObjectId,
    createdAt: Date;
};

const FollowSchema = new Schema<IFollow>(
    {
        followerUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        followingUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        createdAt: { type: Date, default: Date.now },
    }
);

FollowSchema.index({ followerUserId: 1, followingUserId: 1 }, { unique: true });

export const Follow = models.Follow || model<IFollow>("Follow", FollowSchema, "Follow");
