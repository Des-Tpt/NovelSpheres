import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { User } from "@/model/User";
import { Genre } from "@/model/Genre";
import { connectDB } from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        await connectDB();
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ success: false, message: 'Vui lòng đăng nhập!' }, { status: 401 });
        }

        const user = await User.findById(currentUser._id);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ success: false, message: 'Bạn không có quyền truy cập!' }, { status: 403 });
        }

        const keyword = searchParams.get('search') || '';
        const query: any = {};
        if (keyword) {
            query.name = { $regex: keyword, $options: 'i' };
        }

        const genres = await Genre.find(query)
            .skip((page - 1) * limit)
            .limit(limit);

        const totalGenres = await Genre.countDocuments(query);

        return NextResponse.json({
            success: true,
            data: genres,
            pagination: {
                totalElements: totalGenres,
                totalPages: Math.ceil(totalGenres / limit),
                currentPage: page,
                limit: limit
            }
        }, { status: 200 });
    } catch (e) {
        console.log(e);
        return NextResponse.json({ success: false, message: 'Lỗi server' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        await connectDB();
        const currentUser = await getCurrentUser();
        if (!currentUser) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

        const user = await User.findById(currentUser._id);
        if (!user || user.role !== 'admin') return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });

        const { action, genreId, name, description } = await request.json();

        if (action === 'delete') {
            if (!genreId) return NextResponse.json({ success: false, message: 'Missing genreId' }, { status: 400 });
            await Genre.findByIdAndDelete(genreId);
            return NextResponse.json({ success: true, message: 'Xóa thành công' });
        }

        if (action === 'create') {
            if (!name || !description) return NextResponse.json({ success: false, message: 'Thiếu thông tin' }, { status: 400 });
            const existing = await Genre.findOne({ name });
            if (existing) return NextResponse.json({ success: false, message: 'Thể loại đã tồn tại' }, { status: 400 });

            await Genre.create({ name, description });
            return NextResponse.json({ success: true, message: 'Thêm thành công' });
        }

        if (action === 'edit') {
            if (!genreId || !name || !description) return NextResponse.json({ success: false, message: 'Thiếu thông tin' }, { status: 400 });
            const genre = await Genre.findById(genreId);
            if (!genre) return NextResponse.json({ success: false, message: 'Không tìm thấy thể loại' }, { status: 404 });

            genre.name = name;
            genre.description = description;
            await genre.save();
            return NextResponse.json({ success: true, message: 'Cập nhật thành công' });
        }

        return NextResponse.json({ success: false, message: 'Action not valid' }, { status: 400 });
    } catch (e) {
        console.log(e);
        return NextResponse.json({ success: false, message: 'Lỗi server' }, { status: 500 });
    }
}