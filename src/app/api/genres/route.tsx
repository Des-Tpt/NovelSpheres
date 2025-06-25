import { connectDB } from "@/lib/db";
import { Genre } from "@/model/Genre";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    console.log(Genre.modelName);
    try {
        await connectDB();

        const genres = await Genre.find({})
            .collation({ locale: 'vi', strength: 1})
            .select('_id name')
            .sort('name')
            .lean();

        return NextResponse.json(genres);
    }
    catch (error)
    {
        console.log(error);
        return NextResponse.json( {error: 'Lỗi khi lấy dữ liệu'}, {status: 500});
    }
}