import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      role: string;
    };
    return decoded;
  } catch (err) {
    console.error('Invalid token:', err);
    return null;
  }
}
