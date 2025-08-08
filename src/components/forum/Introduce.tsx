'use client'
import { PlusIcon } from "@heroicons/react/24/outline";
import ButtonClick from "../ui/ButtonClick";
import ForumCard from "../ui/ForumCard";
import { getHeaderForum } from "@/action/postActions";
import { Schema } from "mongoose";
import { PostType } from "@/model/PostForum";
import { useQuery } from "@tanstack/react-query";
import Posts from "./Posts";
import { useState } from "react";
import NewPostPopup from "./NewPost";
import { AnimatePresence } from "framer-motion";

interface ForumPost {
    _id: Schema.Types.ObjectId;
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
    countPost: number;
}

const Introduce = () => {
    const { data, isLoading, error } = useQuery<ForumPost[] | null>({
        queryKey: ['post-category'],
        queryFn: getHeaderForum,
        staleTime: 1000 * 60 * 5,
    });

    const [isNewPostPageOpen, setIsNewPostPageOpen] = useState<boolean>(false)

    if (isLoading) {
        return (
            <div className="flex flex-col pt-7 md:px-[14%] bg-black md:bg-gradient-to-r md:from-black md:from-20% md:via-gray-950 md:via-75% md:to-black">
                <div className="flex justify-between bg-gray-950 items-center border-gray-600 shadow-sm border rounded-[0.8rem] p-6">
                    <div className="flex flex-col">
                        <span className="font-bold text-3xl">Diễn đàn cộng đồng NovelSphere</span>
                        <span className="font-inter text-[1.1rem]">Nơi giao lưu, thảo luận và chia sẻ đam mê tiểu thuyết</span>
                    </div>
                    <div>
                        <ButtonClick
                            type={<PlusIcon className="h-5 w-5" />}
                            text="Tạo bài viết"
                            href="#"
                            onClick={() => { setIsNewPostPageOpen(true) }}
                        />
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-x-3 gap-y-4 justify-between py-5">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="border-gray-500 border bg-gray-950 rounded-[1rem] min-h-40 h-auto py-6 pr-2 w-auto flex items-center">
                            <div className="flex justify-center w-full">
                                <div className="pl-5 pr-3 bg-gray-950 items-start">
                                    <div className="w-12 h-12 p-2 rounded-[0.8rem] bg-gray-800 animate-pulse"></div>
                                </div>
                                <div className="flex flex-col gap-1 pr-1.5 w-full">
                                    <div className="h-4 bg-gray-800 rounded animate-pulse mb-1"></div>
                                    <div className="h-3 bg-gray-800 rounded animate-pulse mb-1"></div>
                                    <div className="h-3 bg-gray-800 rounded animate-pulse mb-1"></div>
                                    <div className="h-3 bg-gray-800 rounded animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col pt-7 px-[14%] bg-black md:bg-gradient-to-r md:from-black md:from-20% md:via-gray-950 md:via-75% md:to-black">
                <div className="flex justify-between bg-gray-950 items-center border-gray-600 shadow-sm border rounded-[0.8rem] p-6">
                    <div className="flex flex-col">
                        <span className="font-bold text-3xl">Diễn đàn cộng đồng NovelSphere</span>
                        <span className="font-inter text-[1.1rem]">Nơi giao lưu, thảo luận và chia sẻ đam mê tiểu thuyết</span>
                    </div>
                    <div>
                        <ButtonClick
                            type={<PlusIcon className="h-5 w-5" />}
                            text="Tạo bài viết"
                            href="#"
                            onClick={() => { setIsNewPostPageOpen(true) }}
                        />
                    </div>
                </div>
                <div className="py-5">
                    <p className="text-red-500 text-center">Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại sau.</p>
                </div>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="flex flex-col pt-7 px-[14%] bg-black md:bg-gradient-to-r md:from-black md:from-20% md:via-gray-950 md:via-75% md:to-black">
                <div className="flex justify-between bg-gray-950 items-center border-gray-600 shadow-sm border rounded-[0.8rem] p-6">
                    <div className="flex flex-col">
                        <span className="font-bold text-3xl">Diễn đàn cộng đồng NovelSphere</span>
                        <span className="font-inter text-[1.1rem]">Nơi giao lưu, thảo luận và chia sẻ đam mê tiểu thuyết</span>
                    </div>
                    <div>
                        <ButtonClick
                            type={<PlusIcon className="h-5 w-5" />}
                            text="Tạo bài viết"
                            href="#"
                            onClick={() => setIsNewPostPageOpen(true)}
                        />
                    </div>
                </div>
                <div className="py-5">
                    <p className="text-gray-400 text-center">Chưa có bài viết nào trong diễn đàn.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col pt-7 px-2 md:px-[14%] bg-black md:bg-gradient-to-r md:from-black md:from-20% md:via-gray-950 md:via-75% md:to-black">
            <div className="flex justify-between bg-gray-950 items-center border-gray-600 shadow-sm border rounded-[0.8rem] p-6">
                <div className="flex flex-col">
                    <span className="font-bold text-3xl">Diễn đàn cộng đồng NovelSphere</span>
                    <span className="font-inter text-[1.1rem]">Nơi giao lưu, thảo luận và chia sẻ đam mê tiểu thuyết</span>
                </div>
                <div>
                    <ButtonClick
                        type={<PlusIcon className="h-5 w-5" />}
                        text="Tạo bài viết"
                        href="#"
                        onClick={() => { setIsNewPostPageOpen(true) }}
                    />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-3 gap-y-4 justify-between py-5">
                {data.map(post => (
                    <div key={post._id.toString()}>
                        <ForumCard data={post} />
                    </div>
                ))}
            </div>
            <div>
                <Posts />
            </div>
            <AnimatePresence>
                {isNewPostPageOpen && (
                    <NewPostPopup
                        isOpen={isNewPostPageOpen}
                        onClose={() => setIsNewPostPageOpen(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

export default Introduce;