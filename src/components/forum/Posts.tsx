'use client';

import { useForumPosts } from '@/action/getPost';
import { useEffect, useState, useRef } from 'react';
import LoadingComponent from '../ui/Loading';
import getImage from '@/action/getImage';
import { EyeIcon, Filter, Share2 } from 'lucide-react';
import CustomSelect from '../ui/CustomSelect';
import Image from 'next/image';
import { random } from 'lodash';
import { motion, AnimatePresence } from 'framer-motion';

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

        if (element) {
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

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { 
            opacity: 0, 
            y: 20,
            scale: 0.95
        },
        visible: { 
            opacity: 1, 
            y: 0,
            scale: 1,
            transition: {
                type: "spring" as const,
                stiffness: 100,
                damping: 15
            }
        }
    };

    const filterVariants = {
        hidden: { opacity: 0, y: -20 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: {
                type: "spring" as const,
                stiffness: 120,
                damping: 20
            }
        }
    };

    const paginationVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: {
                type: "spring" as const,
                stiffness: 100,
                damping: 15,
                delay: 0.2
            }
        }
    };

    if (isLoading) return <LoadingComponent/>;
    if (isError) return <p>Có lỗi xảy ra.</p>;

    return (
    <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
    >
        <motion.div 
            className='flex justify-between border-gray-600 border rounded-[0.8rem] py-5 px-5 bg-gray-950'
            variants={filterVariants}
        >
            <div className='flex items-center gap-2'>
                <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                    <Filter className='w-4.5 h-4.5'/>
                </motion.div>
                <span className='font-semibold text-[1.25rem]'>Bộ lọc bài viết</span>
            </div>
            <div className="flex gap-10 items-center">
                <motion.div 
                    className='flex gap-2 items-center'
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                    <div><span>Danh sách:</span></div>
                    <CustomSelect 
                        value={category}
                        onChange={setCategory}
                        options={categoryOptions}
                        placeholder="Tất cả"
                    />
                </motion.div>
                <motion.div 
                    className='flex gap-2 items-center'
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                    <div><span>Sắp xếp:</span></div>
                        <CustomSelect 
                            value={sort}
                            onChange={setSort}
                            options={sortOptions}
                            placeholder="Mới nhất"
                        />
                </motion.div>
            </div>
        </motion.div>

        <motion.div 
            ref={postContainerRef}
            className="mt-4 w-full border border-gray-600 rounded-[0.8rem] overflow-hidden"
            variants={itemVariants}
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={`${page}-${category}-${sort}-${limit}`}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={containerVariants}
                >
                    {data?.data.map((post, index) => (
                    <motion.div 
                        key={post._id} 
                        className="mb-2 w-full bg-gray-950 py-5 px-5"
                        variants={itemVariants}
                        whileHover={{ 
                            scale: 1.02,
                            backgroundColor: "rgba(31, 41, 55, 0.8)",
                            transition: { duration: 0.2 }
                        }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <a href={`forum/post/id=${post._id}`}>
                        <div className='flex gap-5 h-full'>
                            <motion.div 
                                className="flex-shrink-0"
                                whileHover={{ scale: 1.1 }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            >
                                <Image 
                                    src={post?.avatar?.publicId && imageUrls[post.avatar.publicId]
                                        ? imageUrls[post.avatar.publicId]
                                        : 'https://res.cloudinary.com/dr29oyoqx/image/upload/LightNovel/BookCover/96776418_p0_qov0r8.png'
                                    }
                                    width={200}
                                    height={280}
                                    alt={post.title}
                                    className="w-15 h-15 rounded-4xl object-cover object-top"
                                />
                            </motion.div>
                            <div className='flex flex-col flex-1 justify-between'>
                                <div className="flex-1">
                                    <div className='flex justify-between items-center'>
                                        <motion.h3 
                                            className="text-[1.35rem] font-bold"
                                            whileHover={{ color: "#3b82f6" }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            {post.title}
                                        </motion.h3>
                                        <motion.span 
                                            className='font-bold text-[0.8rem] font-sans'
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.1 }}
                                        >
                                            {handleFormatDate(post.createdAt)}
                                        </motion.span>
                                    </div>
                                    <motion.div 
                                        className="flex text-[0.85rem] font-inter font-normal text-white gap-3 py-1.5 items-center"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        <span>{post.owner}</span>•
                                        <motion.span 
                                            className='border border-gray-600 px-2 pt-1 pb-0.5 rounded-[1rem]'
                                            whileHover={{ 
                                                scale: 1.05,
                                                borderColor: "#3b82f6",
                                                backgroundColor: "rgba(59, 130, 246, 0.1)"
                                            }}
                                        >
                                            {handleCategory(post.category)}
                                        </motion.span>•
                                        <motion.span 
                                            className='border border-gray-600 px-2 pt-1 pb-0.5 rounded-[1rem]'
                                            whileHover={{ 
                                                scale: 1.05,
                                                borderColor: "#10b981",
                                                backgroundColor: "rgba(16, 185, 129, 0.1)"
                                            }}
                                        >
                                            {handleRole(post.role)}
                                        </motion.span>
                                    </motion.div>
                                    <motion.p 
                                        className="font-sans text-[0.95rem] line-clamp-2 flex-1"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.3 }}
                                    >
                                        {post.content}
                                    </motion.p>
                                </div>
                                <motion.div 
                                    className='border-b py-2 border-gray-600'
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: 1 }}
                                    transition={{ delay: 0.4, duration: 0.5 }}
                                ></motion.div>
                                <motion.div 
                                    className="mt-auto flex gap-5 pt-2.5 justify-between font-sans"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                >
                                    <div className='flex gap-7 text-[0.88rem] font-bold'>
                                        <motion.div 
                                            className='flex items-center gap-1.5'
                                            whileHover={{ scale: 1.1, color: "#3b82f6" }}
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        >
                                            <Share2 className='w-4 h-4'/>
                                            <span>{post.totalRepiles === 0 ? random(1,10) : post.totalRepiles}</span>
                                        </motion.div>
                                        <motion.div 
                                            className='flex items-center gap-1.5'
                                            whileHover={{ scale: 1.1, color: "#10b981" }}
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        >
                                            <EyeIcon className='w-4.5 h-4.5' />
                                            <span>{post.views === 0 ? random(10, 100) : post.views}</span>
                                        </motion.div>
                                    </div>
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.6 }}
                                    >
                                        <span>#{index}</span>
                                    </motion.div>
                                </motion.div>
                            </div>
                        </div>
                        </a>
                    </motion.div>
                    ))}
                </motion.div>
            </AnimatePresence>
        </motion.div>

        <motion.div 
            className="mt-4 flex flex-col gap-4 border border-gray-600 bg-gray-950 rounded-[0.8rem] p-5"
            variants={paginationVariants}
        >
            <div className='justify-between flex items-center'>
                <motion.p 
                    className="text-[1rem] text-gray-400"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    Hiển thị {startItem}-{endItem} của {totalItems} kết quả
                </motion.p>
                <motion.div 
                    className='items-center flex gap-1.5'
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <span>Hiển thị: </span>
                    <CustomSelect 
                        value={limit}
                        onChange={setLimit}
                        options={limitOptions}
                        placeholder={10}
                    />
                    <span> / trang</span>
                </motion.div>
            </div>
            <motion.div 
                className='flex gap-2.5 justify-center'
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <motion.button 
                    disabled={page === 1} 
                    onClick={() => setPage((p) => p - 1)}
                    className="px-3 border border-gray-600 rounded-md bg-gray-950 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800"
                    whileHover={{ scale: page === 1 ? 1 : 1.02 }}
                    whileTap={{ scale: page === 1 ? 1 : 0.98 }}
                    transition={{ duration: 0.2 }}
                >
                    Trang trước
                </motion.button>
                
                <div className='flex gap-2.5'>
                    {Array.from({ length: TotalPages }, (_, i) => i + 1).map((pageNum) => (
                        <motion.button
                            key={pageNum}
                            onClick={() => setPage(pageNum)}
                            className={`px-3 py-0.5 border border-gray-600 rounded-md text-white ${
                                page === pageNum 
                                    ? 'bg-blue-600 border-blue-500' 
                                    : 'bg-gray-950 hover:bg-gray-800'
                            }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            {pageNum}
                        </motion.button>
                    ))}
                </div>
                <motion.button
                    disabled={!data?.hasMore}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 border border-gray-600 rounded-md bg-gray-950 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800"
                    whileHover={{ scale: !data?.hasMore ? 1 : 1.02 }}
                    whileTap={{ scale: !data?.hasMore ? 1 : 0.98 }}
                    transition={{ duration: 0.2 }}
                >
                    Trang sau
                </motion.button>
            </motion.div>
        </motion.div>
        
        <AnimatePresence>
            {isFetching && (
                <motion.p 
                    className="text-sm text-gray-400"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                >
                    Đang tải trang mới...
                </motion.p>
            )}
        </AnimatePresence>
    </motion.div>
  );
}