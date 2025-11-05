import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { User } from "@/model/User";

export async function GET() {
  const data = await getCurrentUser();
  if (!data) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await User.findById({ _id: data._id })
    .select('_id username email role profile');

  const formattedUser = {
    _id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
    publicId: user.profile.avatar.publicId,
    format: user.profile.avatar.format,
  }

  return NextResponse.json({ user: formattedUser });
}
