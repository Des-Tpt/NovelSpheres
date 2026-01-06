import { connectDB } from "@/lib/db";
import { Follow } from "@/model/Following";
import { Profile } from "@/model/Profile";
import { User } from "@/model/User";
import { NextResponse } from "next/server";

export async function POST(req: Request, context: { params: Promise<{ userId: string }> }) {
    const { userId } = await context.params;
    const { searchParams } = new URL(req.url);
    const followingUserId = searchParams.get("followingUserId");

    if (!followingUserId) {
        return NextResponse.json({ message: "Thiếu dữ liệu cần thiết." }, { status: 400 });
    }

    // Không thể tự theo dõi chính mình
    if (userId === followingUserId) {
        return NextResponse.json({ message: "Không thể theo dõi chính mình." }, { status: 400 });
    }

    await connectDB();

    try {
        const isUserExists = await User.findById(userId);
        const isFollowingUserExists = await User.findById(followingUserId);

        if (!isUserExists || !isFollowingUserExists) {
            return NextResponse.json({ message: "Người dùng không tồn tại." }, { status: 404 });
        }

        const isFollowing = await Follow.findOne({ userId: userId, followingUserId: followingUserId });

        if (isFollowing) {
            await Follow.findOneAndDelete({ userId: userId, followingUserId: followingUserId });

            const [followersCount, followingCount] = await Promise.all([
                Follow.countDocuments({ followingUserId: followingUserId }),
                Follow.countDocuments({ userId: userId })
            ]);

            await Promise.all([
                Profile.findOneAndUpdate(
                    { userId: followingUserId },
                    { $set: { "stats.followers": followersCount } }
                ),
                Profile.findOneAndUpdate(
                    { userId: userId },
                    { $set: { "stats.following": followingCount } }
                )
            ]);

            return NextResponse.json({ message: "Hủy theo dõi thành công!", isFollowing: false }, { status: 200 });
        } else {
            const newFollow = new Follow({ userId, followingUserId });
            await newFollow.save();

            const [followersCount, followingCount] = await Promise.all([
                Follow.countDocuments({ followingUserId: followingUserId }),
                Follow.countDocuments({ userId: userId })
            ]);

            await Promise.all([
                Profile.findOneAndUpdate(
                    { userId: followingUserId },
                    { $set: { "stats.followers": followersCount } }
                ),
                Profile.findOneAndUpdate(
                    { userId: userId },
                    { $set: { "stats.following": followingCount } }
                )
            ]);

            return NextResponse.json({ message: "Theo dõi thành công!", isFollowing: true }, { status: 200 });
        }
    } catch (error) {
        console.error("Error in follow/unfollow:", error);
        return NextResponse.json({ message: "Có lỗi xảy ra khi thực hiện thao tác theo dõi." }, { status: 500 });
    }
}