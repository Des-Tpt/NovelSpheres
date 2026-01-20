import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Novel } from "@/model/Novel";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, context: { params: Promise<{ userId: string }> }) {
    const params = await context.params;
    const userId = params.userId;

    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get('page') || 1;
    const limit = 10;
    const skip = (Number(page) - 1) * Number(limit);

    const currentUser = await getCurrentUser();

    if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (currentUser._id != userId) return NextResponse.json({ error: 'Bạn không được phép truy cập vào workspace này!' }, { status: 403 });

    try {
        await connectDB();

        const novels = await Novel.find({ authorId: userId })
            .populate('genresId', 'name')
            .skip(skip)
            .limit(Number(limit));

        return NextResponse.json({ novels }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}