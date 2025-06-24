import { connectDB } from "@/lib/db";
import { Genre } from "@/model/Genre";
import { User } from "@/model/User";
import { Chapter } from "@/model/Chapter";
import { INovel, Novel } from "@/model/Novel";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
export async function GET(req: NextRequest) {
  await connectDB();

  try {
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

    // Đếm số chương
    const novelsWithChapterCount = await Promise.all(
      novels.map(async (novel) => {
        const chapterCount = await Chapter.countDocuments({
          novelId: novel._id,
        });
        return {
          ...novel.toObject(),
          chapterCount: chapterCount,
        };
      })
    );
    return NextResponse.json(novelsWithChapterCount);
  } catch (e) {
    console.log(e);
    return NextResponse.json({ e: "Lỗi khi lấy dữ liệu" });
  }
}
