'use client'
import { PlusIcon } from "@heroicons/react/24/outline";
import ButtonClick from "../ui/ButtonClick";
import ForumCard from "../ui/ForumCard";
import getHeaderForum from "@/action/getHeaderForum";
import { Schema } from "mongoose";
import { PostType } from "@/model/PostForum";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import getAllPost from "@/action/getAllPost";

interface ForumPost {
    _id: string;
    userId: Schema.Types.ObjectId;
    novelId?: Schema.Types.ObjectId;
    title: string;
    category: PostType;
    isLocked: boolean;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    views: number;
    owner: string;
}

const Posts = () => {
    const { data, isLoading, error } = useQuery<ForumPost[] | null>({
        queryKey: ['post-all'],
        queryFn: getAllPost,
        staleTime: 1000 * 60 * 5,
    });

    console.log(data);

     if (isLoading) {
        return (
            <div></div>
        );
    }

    if (error) {
        return (
            <div>
                {error.message}
            </div>
        );
    }
    return (
        <div>
            {data?.map((post) => (
                <div key={post._id}>
                    <span>{post.owner}</span>
                    <span>{post.content}</span>
                    <span>{post.category}</span>                    
                </div>
            ))}
        </div>
    );
}

export default Posts;