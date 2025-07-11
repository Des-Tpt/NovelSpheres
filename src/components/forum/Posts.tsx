'use client';

import { useForumPosts } from '@/action/getPosts';
import { useEffect, useState, useRef } from 'react';
import LoadingComponent from '../ui/Loading';
import getImage from '@/action/getImage';
import { EyeIcon, Filter, Share2 } from 'lucide-react';
import CustomSelect from '../ui/CustomSelect';
import Image from 'next/image';
import { random } from 'lodash';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatBubbleLeftEllipsisIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';

export default function ForumPage() {
    const [page, setPage] = useState(1);
    const [category, setCategory] = useState('');
    const [sort, setSort] = useState('date');
    const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
    const [limit, setLimit] = useState(10);
    
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
        { value: 5, label: '5'},
        { value: 10, label: '10'},
        { value: 15, label: '15'}
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
    },[category, page, sort, limit])

    useEffect(() => {
        setPage(1)
    },[category, sort, limit])

    const TotalPages = Math.ceil(data?.total! / limit);
    
    useEffect(() => {
        if (!Array.isArray(data?.data)) return;

        data.data.map(async (post) => {
            const publicId = post.avatar?.publicId ?? '';
            const format = post.avatar?.format?? 'jpg';
            const res = await getImage(publicId, format);
            if (res) {
                setImageUrls((prev) => ({ ...prev, [publicId]: res }));
            }
        });
    }, [data]);

    function handleFormatDate(dateInput: Date | string): string {
        return new Date(dateInput).toLocaleDateString('vi-VN'); 
    }

    const startItem = (page - 1) * limit + 1;
    const endItem = Math.min(page * limit, data?.total || 0);
    const totalItems = data?.total || 0;
    
    const handleCategory = (category: String) => {
        switch(category) {
            case 'general' : return 'Thảo luận chung';
            case 'reviews' : return 'Đánh giá & Nhận xét'
            case 'ask-author' : return 'Hỏi đáp tác giả'
            case 'writing' : return 'Sáng tác & Viết lách'
            case 'recommendations' : return 'Gợi ý & Đề xuất'
            case 'support' : return 'Hỗ trợ & Trợ giúp'
        }
    }

    const handleRole = (role: String) => {
        switch(role) {
            case 'admin' : return 'Quản trị viên';
            case 'Writer' : return 'Tác gia'
            case 'reader' : return 'Độc giả'
        }
    }

    // Simplified animation variants - only for essential animations
    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05 // Reduced stagger delay
            }
        }
    };

    const fadeInUp = {
        hidden: { opacity: 0, y: 10 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: { duration: 0.2 } // Faster animation
        }
    };

    if (isLoading) return <LoadingComponent/>;
    if (isError) return <p>Có lỗi xảy ra.</p>;

    return (
    <div className="forum-page">
        <style jsx>{`
            .forum-page {
                animation: fadeIn 0.3s ease-out;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .filter-section {
                transition: all 0.2s ease;
            }
            
            .filter-section:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }
            
            .post-card {
                transition: all 0.2s ease;
            }
            
            .post-card:hover {
                transform: translateY(-2px);
                background-color: rgba(31, 41, 55, 0.8);
            }
            
            .post-image {
                transition: transform 0.2s ease;
            }
            
            .post-image:hover {
                transform: scale(1.05);
            }
            
            .post-title {
                transition: color 0.2s ease;
            }
            
            .post-title:hover {
                color: #3b82f6;
            }
            
            .tag-badge {
                transition: all 0.2s ease;
            }
            
            .tag-badge:hover {
                transform: scale(1.05);
                border-color: #3b82f6;
                background-color: rgba(59, 130, 246, 0.1);
            }
            
            .role-badge {
                transition: all 0.2s ease;
            }
            
            .role-badge:hover {
                transform: scale(1.05);
                border-color: #10b981;
                background-color: rgba(16, 185, 129, 0.1);
            }
            
            .stat-item {
                transition: all 0.2s ease;
            }
            
            .stat-item:hover {
                transform: scale(1.05);
                color: #3b82f6;
            }
            
            .views-stat:hover {
                color: #10b981;
            }
            
            .pagination-btn {
                transition: all 0.2s ease;
            }
            
            .pagination-btn:hover:not(:disabled) {
                transform: translateY(-1px);
                background-color: rgba(55, 65, 81, 1);
            }
            
            .pagination-btn:active:not(:disabled) {
                transform: translateY(0);
            }
            
            .page-number {
                transition: all 0.2s ease;
            }
            
            .page-number:hover {
                transform: translateY(-1px);
            }
            
            .page-number:active {
                transform: translateY(0);
            }
            
            .loading-text {
                animation: pulse 1.5s ease-in-out infinite;
            }
            
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
        `}</style>

        <div className='filter-section flex justify-between border-gray-600 border rounded-[0.8rem] py-5 px-5 bg-gray-950'>
            <div className='flex items-center gap-2'>
                <Filter className='w-4.5 h-4.5'/>
                <span className='font-semibold text-[1.25rem]'>Bộ lọc bài viết</span>
            </div>
            <div className="flex gap-10 items-center">
                <div className='flex gap-2 items-center'>
                    <div><span>Danh sách:</span></div>
                    <CustomSelect 
                        value={category}
                        onChange={setCategory}
                        options={categoryOptions}
                        placeholder="Tất cả"
                    />
                </div>
                <div className='flex gap-2 items-center'>
                    <div><span>Sắp xếp:</span></div>
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
            <div className='flex px-5 py-5 items-center bg-gray-950'>
                <ChatBubbleLeftEllipsisIcon className='w-8 h-8'/>
                <span className='font-bold pl-2.5 text-[1.3rem] pb-1'>Danh sách bài viết</span>
                <span className='pb-1 ml-3 rounded-[0.8rem] border border-gray-600 px-2 font-sans font-bold text-[0.8rem]'>{data?.total} bài đăng</span>
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
                        className="post-card mb-2 w-full bg-gray-950 py-5 px-5 group hover:bg-gray-700 transition-colors duration-200"
                        variants={fadeInUp}
                    >
                        <a href={`forum/post/${post._id}`}>
                        <div className='flex gap-5 h-full'>
                            <div className="flex-shrink-0">
                                <Image 
                                    src={post?.avatar?.publicId && imageUrls[post.avatar.publicId]
                                        ? imageUrls[post.avatar.publicId]
                                        : 'https://res.cloudinary.com/dr29oyoqx/image/upload/LightNovel/BookCover/96776418_p0_qov0r8.png'
                                    }
                                    width={200}
                                    height={280}
                                    alt={post.title}
                                    className="post-image w-15 h-15 rounded-4xl object-cover object-top"
                                />
                            </div>
                            <div className='flex flex-col flex-1 justify-between'>
                                <div className="flex-1">
                                    <div className='flex justify-between items-center'>
                                        <h3 className="post-title text-[1.35rem] font-bold group-hover:text-amber-600 transition-colors duration-200">
                                            {post.title}
                                        </h3>
                                        <span className='font-bold text-[0.8rem] font-sans'>
                                            {handleFormatDate(post.createdAt)}
                                        </span>
                                    </div>
                                    <div className="flex text-[0.85rem] font-inter font-normal text-white gap-3 py-1.5 items-center">
                                        <span>{post.owner}</span>•
                                        <span className='tag-badge border border-gray-600 px-2 pt-1 pb-0.5 rounded-[1rem]'>
                                            {handleCategory(post.category)}
                                        </span>•
                                        <span className='role-badge border border-gray-600 px-2 pt-1 pb-0.5 rounded-[1rem]'>
                                            {handleRole(post.role)}
                                        </span>
                                    </div>
                                    <p className="font-sans text-[0.95rem] line-clamp-2 flex-1">
                                        {post.content}
                                    </p>
                                </div>
                                <div className='border-b py-2 border-gray-600'></div>
                                <div className="mt-auto flex gap-5 pt-2.5 justify-between font-sans">
                                    <div className='flex gap-7 text-[0.88rem] font-bold'>
                                        <div className='stat-item flex items-center gap-1.5'>
                                            <Share2 className='w-4 h-4'/>
                                            <span>{post.totalRepiles === 0 ? random(1,10) : post.totalRepiles}</span>
                                        </div>
                                        <div className='stat-item views-stat flex items-center gap-1.5'>
                                            <EyeIcon className='w-4.5 h-4.5' />
                                            <span>{post.views === 0 ? random(10, 100) : post.views}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <span>#{index}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        </a>
                    </motion.div>
                    ))}
                </motion.div>
            </AnimatePresence>
        </div>

        <div className="mt-4 flex flex-col gap-4 border border-gray-600 bg-gray-950 rounded-[0.8rem] p-5">
            <div className='justify-between flex items-center'>
                <p className="text-[1rem] text-gray-400">
                    Hiển thị {startItem}-{endItem} của {totalItems} kết quả
                </p>
                <div className='items-center flex gap-1.5'>
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
            <div className='flex gap-2.5 justify-center'>
                <button 
                    disabled={page === 1} 
                    onClick={() => setPage((p) => p - 1)}
                    className="pagination-btn px-3 border border-gray-600 rounded-md bg-gray-950 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Trang trước
                </button>
                
                <div className='flex gap-2.5'>
                    {Array.from({ length: TotalPages }, (_, i) => i + 1).map((pageNum) => (
                        <button
                            key={pageNum}
                            onClick={() => setPage(pageNum)}
                            className={`page-number px-3 py-0.5 border border-gray-600 rounded-md text-white ${
                                page === pageNum 
                                    ? 'bg-blue-600 border-blue-500' 
                                    : 'bg-gray-950 hover:bg-gray-800'
                            }`}
                        >
                            {pageNum}
                        </button>
                    ))}
                </div>
                <button
                    disabled={!data?.hasMore}
                    onClick={() => setPage((p) => p + 1)}
                    className="pagination-btn px-3 border border-gray-600 rounded-md bg-gray-950 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Trang sau
                </button>
            </div>
        </div>
        
        <AnimatePresence>
            {isFetching && (
                <motion.p 
                    className="loading-text text-sm text-gray-400"
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