'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import getImage from '@/action/imageActions';
import { EyeIcon, Filter, Share2 } from 'lucide-react';
import CustomSelect from '../ui/CustomSelect';
import Image from 'next/image';
import { random } from 'lodash';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatBubbleLeftEllipsisIcon } from '@heroicons/react/24/outline';
import LoadingPostComponent from '../ui/LoadingPost';
import { useSearchParams } from 'next/navigation';
import { useForumPosts } from '@/action/postActions';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import stripHtml from '@/utils/stripHtml';

const cloudname = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME! as string;

export default function ForumPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [page, setPage] = useState(1);
    const [category, setCategory] = useState('');
    const [sort, setSort] = useState('date');
    const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
    const [limit, setLimit] = useState(10);

    useEffect(() => {
        const queryCategory = searchParams.get('category');
        const querySort = searchParams.get('sort');
        const queryPage = searchParams.get('page');
        const queryLimit = searchParams.get('limit');

        if (queryCategory !== null) setCategory(queryCategory);
        if (querySort !== null) setSort(querySort);
        if (queryPage !== null) setPage(parseInt(queryPage));
        if (queryLimit !== null) setLimit(parseInt(queryLimit));
    }, []);

    const { data, isLoading, isFetching, isError } = useForumPosts({
        page,
        category,
        sort,
        limit
    });

    const categoryOptions = [
        { value: "", label: "Tất cả" },
        { value: "general", label: "Thảo luận chung" },
        { value: "reviews", label: "Đánh giá" },
        { value: "recommendations", label: "Gợi ý" },
        { value: "ask-author", label: "Hỏi tác giả" }
    ];

    const sortOptions = [
        { value: "date", label: "Mới nhất" },
        { value: "title", label: "Tên A-Z" },
        { value: "views", label: "Xem nhiều" }
    ];

    const limitOptions = [
        { value: 5, label: '5' },
        { value: 10, label: '10' },
        { value: 15, label: '15' }
    ];

    const postContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const headerOffset = 64;
        const element = postContainerRef.current;

        if (element && (category || page > 1 || sort !== 'date' || limit !== 10)) {
            const offsetTop = element.getBoundingClientRect().top + window.scrollY;
            window.scrollTo({
                top: offsetTop - headerOffset,
                behavior: 'smooth',
            });
        }
    }, [category, page, sort, limit])

    useEffect(() => {
        setPage(1)
    }, [category, sort, limit])

    const TotalPages = Math.ceil(data?.total! / limit);

    useEffect(() => {
        if (!Array.isArray(data?.data)) return;

        data.data.map(async (post) => {
            const publicId = post.avatar?.publicId ?? '';
            const format = post.avatar?.format ?? 'jpg';
            const res = await getImage(publicId, format);
            if (res) {
                setImageUrls((prev) => ({ ...prev, [publicId]: res }));
            }
        });
    }, [data]);

    const getTimeAgo = (updatedAt: string | Date) => {
        return `Cập nhật ${formatDistanceToNow(new Date(updatedAt), { addSuffix: true, locale: vi })}`;
    };

    const startItem = (page - 1) * limit + 1;
    const endItem = Math.min(page * limit, data?.total || 0);
    const totalItems = data?.total || 0;



    const handleCategory = (category: String) => {
        switch (category) {
            case 'general': return 'Thảo luận chung';
            case 'reviews': return 'Đánh giá & Nhận xét'
            case 'ask-author': return 'Hỏi đáp tác giả'
            case 'writing': return 'Sáng tác & Viết lách'
            case 'recommendations': return 'Gợi ý & Đề xuất'
            case 'support': return 'Hỗ trợ & Trợ giúp'
        }
    }

    const handleRole = (role: String) => {
        switch (role) {
            case 'admin': return 'Quản trị viên';
            case 'writer': return 'Tác gia'
            case 'reader': return 'Độc giả'
        }
    }

    const handlePostClick = (postId: string) => {
        router.push(`/forum/post/${postId}`);
    }

    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const fadeInUp = {
        hidden: { opacity: 0, y: 10 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.2 }
        }
    };

    if (isLoading) return <LoadingPostComponent />;
    if (isError) return <p>Có lỗi xảy ra!</p>;

    return (
        <div className="forum-page animate-fadeIn">
            <div className="filter-section flex justify-between border border-gray-600 rounded-[0.8rem] py-5 px-5 bg-gray-950 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-all duration-200">
                <div className="flex items-center gap-2">
                    <Filter className="w-4.5 h-4.5" />
                    <span className="font-semibold text-[1.25rem]">Bộ lọc bài viết</span>
                </div>
                <div className="flex gap-10 items-center">
                    <div className="flex gap-2 items-center">
                        <span>Danh sách:</span>
                        <CustomSelect
                            value={category}
                            onChange={setCategory}
                            options={categoryOptions}
                            placeholder="Tất cả"
                        />
                    </div>
                    <div className="flex gap-2 items-center">
                        <span>Sắp xếp:</span>
                        <CustomSelect
                            value={sort}
                            onChange={setSort}
                            options={sortOptions}
                            placeholder="Mới nhất"
                        />
                    </div>
                </div>
            </div>

            <div
                ref={postContainerRef}
                className="mt-4 w-full border border-gray-600 rounded-[0.8rem] overflow-hidden"
            >
                <div className="flex px-3 md:px-5 py-5 items-center bg-gray-950">
                    <ChatBubbleLeftEllipsisIcon className="w-6 h-6 md:w-8 md:h-8" />
                    <span className="font-bold pl-2.5 text-[1.1rem] md:text-[1.3rem] pb-1">Danh sách bài viết</span>
                    <span className="pb-1 ml-2 md:ml-3 rounded-[0.8rem] border border-gray-600 px-1.5 md:px-2 font-sans font-bold text-[0.7rem] md:text-[0.8rem]">{data?.total} bài đăng</span>
                </div>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${page}-${category}-${sort}-${limit}`}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        variants={staggerContainer}
                    >
                        {data?.data.map((post, index) => (
                            <motion.div
                                key={post._id}
                                className="post-card mb-2 w-full bg-gray-950 py-3 md:py-5 px-3 md:px-5 group hover:bg-gray-700 transition-colors duration-200 cursor-pointer"
                                variants={fadeInUp}
                                onClick={() => handlePostClick(post._id)}
                            >
                                <div className="flex flex-col md:flex-row gap-3 md:gap-5 h-full">
                                    <div className="flex-shrink-0 flex justify-center md:justify-start">
                                        <Image
                                            src={post?.avatar?.publicId && imageUrls[post.avatar.publicId]
                                                ? imageUrls[post.avatar.publicId]
                                                : `https://res.cloudinary.com/${cloudname}/image/upload/LightNovel/BookCover/96776418_p0_qov0r8.png`
                                            }
                                            width={200}
                                            height={280}
                                            alt={post.title}
                                            className="post-image w-12 h-12 md:w-15 md:h-15 rounded-2xl md:rounded-4xl object-cover object-top transition-transform duration-200 hover:scale-105"
                                        />
                                    </div>
                                    <div className="flex flex-col flex-1 justify-between">
                                        <div className="flex-1">
                                            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 md:gap-0">
                                                <h3 className="post-title text-[1.1rem] md:text-[1.35rem] font-bold group-hover:text-amber-600 transition-colors duration-200">
                                                    {post.title}
                                                </h3>
                                                <span className="font-bold text-[0.75rem] md:text-[0.8rem] font-sans text-gray-400 md:text-white">
                                                    {getTimeAgo(post.lastCommentAt ?? post.createdAt)}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap text-[0.8rem] md:text-[0.85rem] font-inter font-normal text-white gap-2 md:gap-3 py-1.5 items-center">
                                                <span>{post.owner}</span>•
                                                <span className="tag-badge border border-gray-600 px-2 pt-1 pb-0.5 rounded-[1rem] transition-all duration-200 hover:scale-105 hover:border-blue-500 hover:bg-blue-500/10">
                                                    {handleCategory(post.category)}
                                                </span>•
                                                <span className="role-badge border border-gray-600 px-2 pt-1 pb-0.5 rounded-[1rem] transition-all duration-200 hover:scale-105 hover:border-green-500 hover:bg-green-500/10">
                                                    {handleRole(post.role)}
                                                </span>
                                            </div>
                                            <p className="font-sans text-[0.9rem] md:text-[0.95rem] line-clamp-2 flex-1">
                                                {stripHtml(post.content)}
                                            </p>
                                        </div>
                                        <div className="border-b py-2 border-gray-600"></div>
                                        <div className="mt-auto flex gap-3 md:gap-5 pt-2.5 justify-between font-sans">
                                            <div className="flex gap-4 md:gap-7 text-[0.8rem] md:text-[0.88rem] font-bold">
                                                <div className="stat-item flex items-center gap-1.5 transition-all duration-200 hover:scale-105 hover:text-blue-500">
                                                    <Share2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                                    <span>{post.totalRepiles === 0 ? random(1, 10) : post.totalRepiles}</span>
                                                </div>
                                                <div className="stat-item views-stat flex items-center gap-1.5 transition-all duration-200 hover:scale-105 hover:text-green-500">
                                                    <EyeIcon className="w-4 h-4 md:w-4.5 md:h-4.5" />
                                                    <span>{post.views}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <span>#{index + 1}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="mt-4 flex flex-col gap-4 border border-gray-600 bg-gray-950 rounded-[0.8rem] p-5">
                <div className="flex justify-between items-center">
                    <p className="text-[1rem] text-gray-400">
                        Hiển thị {startItem}-{endItem} của {totalItems} kết quả
                    </p>
                    <div className="flex items-center gap-1.5">
                        <span>Hiển thị: </span>
                        <CustomSelect
                            value={limit}
                            onChange={setLimit}
                            options={limitOptions}
                            placeholder={10}
                        />
                        <span> / trang</span>
                    </div>
                </div>
                <div className="flex gap-2.5 justify-center">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage((p) => p - 1)}
                        className="pagination-btn px-3 border border-gray-600 rounded-md bg-gray-950 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-px hover:bg-gray-800 active:translate-y-0 transition-all duration-200"
                    >
                        Trang trước
                    </button>

                    <div className="flex gap-2.5">
                        {Array.from({ length: TotalPages }, (_, i) => i + 1).map((pageNum) => (
                            <button
                                key={pageNum}
                                onClick={() => setPage(pageNum)}
                                className={`page-number px-3 py-0.5 border border-gray-600 rounded-md text-white ${page === pageNum
                                    ? 'bg-blue-600 border-blue-500'
                                    : 'bg-gray-950 hover:bg-gray-800'} hover:-translate-y-px active:translate-y-0 transition-all duration-200`}
                            >
                                {pageNum}
                            </button>
                        ))}
                    </div>
                    <button
                        disabled={!data?.hasMore}
                        onClick={() => setPage((p) => p + 1)}
                        className="pagination-btn px-3 border border-gray-600 rounded-md bg-gray-950 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-px hover:bg-gray-800 active:translate-y-0 transition-all duration-200"
                    >
                        Trang sau
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {isFetching && (
                    <motion.p
                        className="text-sm text-gray-400 animate-pulse"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        Đang tải trang mới...
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
}