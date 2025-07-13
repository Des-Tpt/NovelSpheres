import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      _id: string;
      username: string;
      publicId: string;
      format: string;
      role: string;
    };
    return decoded;

  } catch (err) {
    console.error('Token không khả dụng:', err);
    return null;
  }
}