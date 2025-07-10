import { connectDB } from "@/lib/db";
import { Genre } from "@/model/Genre";
import { IGenre } from "@/model/Genre";
import { Chapter } from "@/model/Chapter";
import { INovel, Novel } from "@/model/Novel";
import { User } from '@/model/User';
import { IUser } from '@/model/User';
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const genreIds = searchParams.getAll("genreIds");

    const sortBy = searchParams.get("sortBy");
    const allowedSortFields = ["createdAt", "views", "title"];

    let sortQuery: Record<string, 1 | -1> = {};

    if (sortBy && allowedSortFields.includes(sortBy)) {
        sortQuery[sortBy] = -1;
    } else {
        sortQuery["createdAt"] = -1;
    }

    // Kiểm tra ObjectId
    if (genreIds.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
        return NextResponse.json({ error: "ID không hợp lệ" }, { status: 400 });
    }

    let novels: INovel[];

    // Nếu không lọc theo thể loại
    if (!genreIds || genreIds.length === 0) {
      novels = await Novel.find({})
        .sort(sortQuery)
        .limit(6)
        .populate("authorId", "username")
        .populate("genresId", "name");
    } else {
        const objectGenreIds = genreIds.map(
            (id) => new mongoose.Types.ObjectId(id)
    );

    novels = await Novel.find({ genresId: { $all: objectGenreIds } })
        .sort(sortQuery)
        .limit(6)
        .populate("authorId", "username")
        .populate("genresId", "name");
    }

    // Đếm số chương + Add thể loại chính
    const novelsWithChapterCount = await Promise.all(
      novels.map(async (novel) => {
        
        const chapterCount = await Chapter.countDocuments({
          novelId: novel._id,
        });
        const firstGenreId = novel.genresId[0]
        const genres = await Genre.findById(firstGenreId).lean<IGenre>();
        const user = await User.findById(novel.authorId).lean<IUser>();
        
        return {
          ...novel.toObject(),
          authorName: user?.username || 'Vô danh',
          chapterCount: chapterCount,
          firstGenreName: genres?.name || 'Không rõ',
        };
      })
    );
    return NextResponse.json(novelsWithChapterCount);
  } catch (e) {
    console.log(e);
    return NextResponse.json({ e: "Lỗi khi lấy dữ liệu" });
  }
}
