import { NextResponse, NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/model/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { error } from "console";


export interface IUser {
  _id: string;
  username: string;
  email: string;
  password: string;
  role: 'reader' | 'admin' | 'writer';
  profile?: {
    bio?: string;
    avatar?: {
      publicId: string;
      format: string;
    };
  };
  createdAt: Date;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Vui lòng nhập đầy đủ thông tin' }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOne({ email }).lean<IUser>();
    const isMatch = user && await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return NextResponse.json({ error: 'Email hoặc mật khẩu không đúng' }, { status: 401 });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) return NextResponse.json({error: "JWT_SECRET is not defined"},  { status: 404 });

    //Tạo jwt token (về cơ bản là 1 interface chứa các attribute được lưu vào cookies)
    const token = jwt.sign(
      { 
        _id: user._id, 
        username: user.username,
        role: user.role,
        email: user.email,
        publicId: user.profile?.avatar?.publicId,
        format: user.profile?.avatar?.format
      },
      process.env.JWT_SECRET!,
      { expiresIn: '2d' }
    );
    
    (await cookies()).set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 2,
      sameSite: 'strict',
    })

    return NextResponse.json({
      success: true,
      message: 'Đăng nhập thành công',
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Không thể đăng nhập' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';