import { NextResponse, NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/model/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Vui lòng nhập đầy đủ thông tin' }, { status: 400 });
    }

    await connectDB();

    // Tìm user
    const user = await User.findOne({ email });
    const isMatch = user && await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return NextResponse.json({ error: 'Email hoặc mật khẩu không đúng' }, { status: 401 });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET is not defined");

    // Tạo JWT
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '2d' }
    );
    
    (await cookies()).set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 2,
      sameSite: 'strict',
    })

    console.log((await cookies()).get);

    return NextResponse.json({
      success: true,
      message: 'Đăng nhập thành công',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Không thể đăng nhập' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';