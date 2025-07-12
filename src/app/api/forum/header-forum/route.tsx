import { NextRequest, NextResponse } from "next/server";
import { ForumPost, IForumPost } from "@/model/PostForum";
import { connectDB } from "@/lib/db";
import { IUser, User } from "@/model/User";


export async function GET(req: NextRequest) {
    await connectDB();
    try {
        console.log(ForumPost.modelName);
        
        const data = await ForumPost.aggregate([{ $group: { _id: "$category" , doc: { $first: "$$ROOT" } } }, { $replaceRoot: { newRoot: "$doc"}}]);
        const dataWithUser = await Promise.all(data.map(getPostOwner));
        const res = await Promise.all(dataWithUser.map(getPostCount))

        return NextResponse.json(res);
    } catch (e) {
        console.log(e);
        return NextResponse.json({error: 'Không thể lấy thông tin.'} , { status: 200 })
    }
}

async function getPostOwner(data: IForumPost) {
    const owner = await User.findById(data.userId).lean<IUser>();

    const base = {
        ...data,
        owner: owner?.username || 'Vô danh',
    }
    return base;
}

async function getPostCount(data: any) {
    const count = await ForumPost.countDocuments({ category: data.category });

    const base = {
        ...data,
        countPost: count,
    }
    return base;
}