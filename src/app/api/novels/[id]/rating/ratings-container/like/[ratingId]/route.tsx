import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Rating } from "@/model/Rating";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string, ratingId: string }> }) {
    try {
        await connectDB();

        const { id, ratingId } = await context.params;

        const searchParams = request.nextUrl.searchParams;
        const userId = searchParams.get('userId');
        const action = searchParams.get('action');

        const currentUser = await getCurrentUser();

        if (!currentUser) return NextResponse.json({ error: 'Bạn chưa đăng nhập' }, { status: 401 });

        if (userId !== currentUser._id.toString()) return NextResponse.json({ error: 'Bạn không có quyền thực hiện hành động này' }, { status: 403 });

        const ratting = await Rating.findOne({ novelId: id, _id: ratingId });

        if (!ratting) return NextResponse.json({ error: 'Không tìm thấy đánh giá' }, { status: 404 });

        if (action === 'like') {
            // Nếu đã like -> hủy like
            if (ratting.likes.userIds.includes(userId)) {
                ratting.likes.count -= 1;
                ratting.likes.userIds = ratting.likes.userIds.filter((_id: string) => _id !== userId);
            } else {
                // Chưa like -> thêm like
                ratting.likes.count += 1;
                ratting.likes.userIds.push(userId);

                // Nếu đang dislike -> bỏ dislike
                if (ratting.dislikes.userIds.includes(userId)) {
                    ratting.dislikes.count -= 1;
                    ratting.dislikes.userIds = ratting.dislikes.userIds.filter((_id: string) => _id !== userId);
                }
            }
        } else if (action === 'dislike') {
            // Nếu đã dislike -> hủy dislike
            if (ratting.dislikes.userIds.includes(userId)) {
                ratting.dislikes.count -= 1;
                ratting.dislikes.userIds = ratting.dislikes.userIds.filter((_id: string) => _id !== userId);
            } else {
                // Chưa dislike -> thêm dislike
                ratting.dislikes.count += 1;
                ratting.dislikes.userIds.push(userId);

                // Nếu đang like -> bỏ like
                if (ratting.likes.userIds.includes(userId)) {
                    ratting.likes.count -= 1;
                    ratting.likes.userIds = ratting.likes.userIds.filter((_id: string) => _id !== userId);
                }
            }
        } else {
            return NextResponse.json({ error: 'Hành động không hợp lệ' }, { status: 400 });
        }

        await ratting.save();
        return NextResponse.json({ ratting }, { status: 200 });

    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: 'Lỗi khi thực hiện hành động' }, { status: 500 });
    }
}
