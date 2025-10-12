import { Act } from "@/model/Act";
import { Chapter } from "@/model/Chapter";
import { Comment } from "@/model/Comment";
import { Novel } from "@/model/Novel";
import { Profile } from "@/model/Profile";
import { Rating } from "@/model/Rating";
import { Types } from "mongoose";

export const NovelService = {
    async updateAuthorTotalViews(authorId: string) {
        try {
            const authorObjectId = new Types.ObjectId(authorId);

            const agg = await Novel.aggregate([
                { $match: { authorId: authorObjectId } },
                { $group: { _id: null, total: { $sum: "$views" } } }
            ]);

            const totalViews = agg[0]?.total ?? 0;

            // Update totalNovels count
            const totalNovels = await Novel.countDocuments({ authorId: authorObjectId });

            const updatedProfile = await Profile.findOneAndUpdate(
                { userId: authorObjectId },
                {
                    $set: {
                        "stats.totalViews": totalViews,
                        "stats.totalNovels": totalNovels
                    }
                },
                { upsert: true, new: true }
            );
            return totalViews;
        } catch (error) {
            console.error('Error updating author total views:', error);
            throw error;
        }
    },

    async incrementNovelViews(novelId: string) {
        try {
            const novel = await Novel.findByIdAndUpdate(
                novelId,
                { $inc: { views: 1 } },
                { new: true }
            );

            if (!novel) {
                console.log('Novel not found:', novelId);
                return;
            }

            // Convert ObjectId to string for the service call
            await this.updateAuthorTotalViews(novel.authorId.toString());
        } catch (error) {
            console.error('Error incrementing novel views:', error);
            throw error;
        }
    },

    async deleteNovel(novelId: string) {
        try {
            // 1. Tìm novel trước khi xóa để lấy authorId
            const novel = await Novel.findById(novelId);
            if (!novel) return false; // Novel không tồn tại

            const authorId = novel.authorId.toString();

            // 2. Xóa novel
            await Novel.findByIdAndDelete(novelId);

            // 3. Xóa dữ liệu liên quan
            await Promise.all([
                Act.deleteMany({ novelId }),
                Chapter.deleteMany({ novelId }),
                Comment.deleteMany({ sourceType: "Novel", sourceId: novelId }),
                Rating.deleteMany({ novelId }),
            ]);

            // 4. Update total views của author (sau khi đã xóa novel)
            await this.updateAuthorTotalViews(authorId);

            return true; // Xóa thành công
        } catch (error) {
            console.error('Error deleting novel:', error);
            throw error;
        }
    },
};