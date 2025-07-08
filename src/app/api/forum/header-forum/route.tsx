import { NextRequest, NextResponse } from "next/server";
import { ForumPost, IForumPost } from "@/model/PostForum";
import { connectDB } from "@/lib/db";
import { IUser, User } from "@/model/User";


export async function GET(req: NextRequest) {
    await connectDB();
    try {
        console.log(ForumPost.modelName);
        
        const data = await ForumPost.aggregate([{ $group: { _id: "$category" , doc: { $first: "$$ROOT" } } }, { $replaceRoot: { newRoot: "$doc"}}]);
        const res = await Promise.all(data.map(getPostOwner));

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