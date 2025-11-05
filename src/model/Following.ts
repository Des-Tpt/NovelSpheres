
import { Document, Schema, model, models } from "mongoose";
import { Profile } from "./Profile";

interface IFollow extends Document {
    userId: Schema.Types.ObjectId,
    followingUserId: Schema.Types.ObjectId,
    createdAt: Date;
};

const FollowSchema = new Schema<IFollow>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        followingUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        createdAt: { type: Schema.Types.Date, default: Date.now },
    }
);

FollowSchema.post("save", async function (doc) {
    // cập nhật followers cho người bị follow (B)
    const followers = await Follow.countDocuments({ followingUserId: doc.followingUserId });
    await Profile.findOneAndUpdate(
        { userId: doc.followingUserId },
        { $set: { "stats.followers": followers } }
    );

    // cập nhật following cho người đi follow (A)
    const following = await Follow.countDocuments({ userId: doc.userId });
    await Profile.findOneAndUpdate(
        { userId: doc.userId },
        { $set: { "stats.following": following } }
    );
});

FollowSchema.post("findOneAndDelete", async function (doc) {
    if (!doc) return;

    // cập nhật followers cho người bị follow (B)
    const followers = await Follow.countDocuments({ followingUserId: doc.followingUserId });
    await Profile.findOneAndUpdate(
        { userId: doc.followingUserId },
        { $set: { "stats.followers": followers } }
    );

    // cập nhật following cho người đi follow (A)
    const following = await Follow.countDocuments({ userId: doc.userId });
    await Profile.findOneAndUpdate(
        { userId: doc.userId },
        { $set: { "stats.following": following } }
    );
});

FollowSchema.index({ userId: 1, followingUserId: 1 }, { unique: true });


export const Follow = models.Follow || model<IFollow>("Follow", FollowSchema, "Follow");
