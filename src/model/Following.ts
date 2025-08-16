
import { Schema, model, models } from "mongoose";

const FollowSchema = new Schema(
    {
        followerId: { type: Schema.Types.ObjectId, ref: "Profile", required: true }, 
        followingId: { type: Schema.Types.ObjectId, ref: "Profile", required: true }, 
        createdAt: { type: Date, default: Date.now },
    }
);

FollowSchema.index({ followerId: 1, followingId: 1 }, { unique: true }); 

export default models.Follow || model("Follow", FollowSchema);
