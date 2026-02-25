import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/model/User";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
    try {
        await connectDB();
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');

        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ success: false, message: 'Vui lòng đăng nhập!' }, { status: 401 });
        }

        const user = await User.findById(currentUser._id);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ success: false, message: 'Bạn không có quyền truy cập!' }, { status: 403 });
        }

        const keyword = searchParams.get('search') || '';
        const query: any = { isDeleted: { $in: [true, false] } }; // Bypass the autoFilterDeleted middleware

        if (keyword) {
            query.$or = [
                { username: { $regex: keyword, $options: 'i' } },
                { email: { $regex: keyword, $options: 'i' } }
            ];
        }

        const users = await User.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const totalUsers = await User.countDocuments(query);

        return NextResponse.json({
            success: true,
            data: users,
            pagination: {
                totalElements: totalUsers,
                totalPages: Math.ceil(totalUsers / limit),
                currentPage: page,
                limit: limit
            }
        }, { status: 200 });

    } catch {
        return NextResponse.json({ success: false, message: 'Lỗi server' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        await connectDB();
        const { userId, action, username, email, role, password } = await request.json();
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            return NextResponse.json({ success: false, message: 'Vui lòng đăng nhập!' }, { status: 401 });
        }
        const user = await User.findById(currentUser._id);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ success: false, message: 'Bạn không có quyền truy cập!' }, { status: 403 });
        }

        const targetUser = await User.findOne({ _id: userId, isDeleted: { $in: [true, false] } });
        if (!targetUser) {
            return NextResponse.json({ success: false, message: 'Không tìm thấy người dùng!' }, { status: 404 });
        }

        if (action === 'delete') {
            targetUser.isDeleted = true;
        }

        else if (action === 'restore') {
            targetUser.isDeleted = false;
        }

        else if (action === 'edit') {
            targetUser.username = username;
            targetUser.email = email;
            targetUser.role = role;
            if (password && password.trim() !== '') {
                targetUser.password = await bcrypt.hash(password, 10);
            }
        }

        await targetUser.save();
        return NextResponse.json({ success: true, message: 'Cập nhật thành công!' }, { status: 200 });
    } catch {
        return NextResponse.json({ success: false, message: 'Lỗi server' }, { status: 500 });
    }
}