import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/model/User';
import bcrypt from 'bcryptjs';
import { Profile } from '@/model/Profile';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { username, email, password, role } = await req.json();

    // Kiểm tra dữ liệu
    if (!username || !email || !password) {
      return NextResponse.json({ error: 'Vui lòng nhập đầy đủ thông tin' }, { status: 400 });
    }

    await connectDB();

    // Kiểm tra user đã tồn tại
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'Tài khoản đã được đăng ký' }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Email không hợp lệ' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Mật khẩu phải có ít nhất 6 ký tự' }, { status: 400 });
    }
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo user
    const user = new User({
      username,
      email,
      password: hashedPassword,
      role: role || 'reader',
      profile: { bio: '' },
      createdAt: new Date(),
    });

    await user.save();

    await Profile.create({
      userId: user._id,
      bio: "",
      socials: {},
      stats: {
        followers: 0,
        following: 0,
        totalViews: 0,
        totalNovels: 0,
      },
    });

    return NextResponse.json({ success: true, message: 'Đăng ký thành công', userId: user._id, username: user.username });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Không thể đăng ký tài khoản' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';