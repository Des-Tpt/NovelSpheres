import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
    // Xoá cookie tên 'token'
    (await cookies()).delete('token');

    return NextResponse.json({
        success: true,
        message: 'Đăng xuất thành công',
    });
}
