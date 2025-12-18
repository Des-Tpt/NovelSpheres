import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { User } from "@/model/User";
import { connectDB } from "@/lib/db";

export async function GET() {
  await connectDB(); 

  const data = await getCurrentUser();
  if (!data) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await User.findById(data._id)
    .select('_id username email role profile');

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const formattedUser = {
    _id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
    publicId: user.profile?.avatar?.publicId ?? null,
    format: user.profile?.avatar?.format ?? null,
  };

  return NextResponse.json({ user: formattedUser });
}
