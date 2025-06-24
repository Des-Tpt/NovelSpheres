'use client';
import { useQuery } from "@tanstack/react-query";
import getFeatureNovels from "@/action/getFeatureNovels";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import getImage from "@/action/getImage";
import { ArrowRightIcon, BookOpenIcon } from "@heroicons/react/24/outline";
import { random } from "lodash";
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Navigation, Pagination } from 'swiper/modules';

type Novel = {
    _id: string;
    title: string;
    coverImage?: CoverImage;
    description: string;
    rating?: number;
    status: string;
    firstGenreName: string;
    chapterCount?: number;
    authorName?: string | null;
    url?: string | null;
}

type CoverImage = {
    publicId: string;
    format: string;
};

interface BookCardProps {
    novel: Novel;
    imageUrls: Record<string, string>;
    index?: number;
    showAnimation?: boolean;
}

// BookCard Component
const BookCard: React.FC<BookCardProps> = ({ novel, imageUrls, index = 0, showAnimation = true }) => {
    const cardContent = (
        <div className="m-4 flex flex-col cursor-pointer rounded-lg group hover:scale-105 hover:shadow-white hover:shadow-2xl duration-300 transition-all">
            <a href={`novel-detailed?id=${novel._id}`}>
                <div className="relative items-center rounded-lg overflow-hidden">
                    <img
                        src={novel.coverImage?.publicId 
                            ? imageUrls[novel.coverImage.publicId] 
                            : 'https://res.cloudinary.com/dr29oyoqx/image/upload/LightNovel/BookCover/96776418_p0_qov0r8.png'
                        }
                        alt={novel.title}
                        className="w-142 h-142 object-cover"
                    />
                    <div className="flex">
                        <span className="rounded-2xl absolute bg-gray-600 py-0.25 px-2 font-semibold text-[1rem] top-2.5 left-2.5">
                            {novel.rating ? `⭐ ${novel.rating}` : 'Chưa có đánh giá'}
                        </span>
                        <span className="rounded-2xl absolute bg-gray-600 py-0.5 px-4 font-semibold top-2.5 right-2.5">
                            {novel.status}
                        </span>
                    </div>

                    <div className="bg-black rounded-b-lg h-55 sm:h-60 relative">
                        <div className="flex flex-col p-3">
                            <span className="font-bold text-[1.4rem] group-hover:text-amber-600 transition-colors duration-300">
                                {novel.title}
                            </span>
                            <span className="pl-1 py-3 font-inter">của {novel.authorName}</span>
                            <span className="text-[0.9rem] font-inter">{novel.description}</span>
                            <div className="flex justify-between">
                                <span className="rounded-2xl border px-3 font-sans absolute bottom-3 left-5">
                                    {novel.firstGenreName}
                                </span>
                                <span className="rounded-2xl border px-3 flex items-center absolute bottom-3 right-5">
                                    <BookOpenIcon className="w-5 h-5 pr-1"/>
                                    {novel.chapterCount ? ` ${novel.chapterCount} chương` : ` ${random(1, 1000)} chương`}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </a>
        </div>
    );

    if (!showAnimation) {
        return cardContent;
    }

    return (
        <motion.div
            key={novel._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
                duration: 0.4, 
                delay: index * 0.15
            }}
        >
            {cardContent}
        </motion.div>
    );
};

const FeatureBook: React.FC = () => {
    const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
    
    const { data, isLoading, error } = useQuery<Novel[] | null>({
        queryKey: ['feature-novels'],
        queryFn: getFeatureNovels,
        staleTime: 1000 * 60 * 5,
    });

    useEffect(() => {
        if (data) {
            data.map(async (novel) => {
                const publicId = novel.coverImage?.publicId;
                const format = novel.coverImage?.format ?? 'jpg';
                if (publicId && !imageUrls[publicId]) {
                    const res = await getImage(publicId, format);
                    if (res) {
                        setImageUrls((prev) => ({ ...prev, [publicId]: res }));
                    }
                }
            });
        }
    }, [data, imageUrls]);

    if (isLoading) return (
        <div className="flex flex-col pt-7 bg-gradient-to-r from-black from-20% via-gray-950 via-75% to-black min-h-screen"></div>
    );
    if (error instanceof Error) return <p>Lỗi: {error.message}</p>;
    if (!data || data.length === 0) return <p>Không có dữ liệu</p>;

    return (
        <div className="flex flex-col pt-7 bg-gradient-to-r from-black from-20% via-gray-950 via-75% to-black">
            <div className="flex justify-between items-center md:px-[14.8%] px-10">
                <span className="font-bold text-[2rem]">Có thể bạn sẽ thích?</span>
                <button className="flex cursor-pointer text-amber-600 font-inter rounded-[10px] px-4 py-1.5 hover:bg-gray-600">
                    Xem tất cả <ArrowRightIcon className="pl-2 w-6 h-6"/>
                </button>
            </div>
            
            {/* Giao diện cho Desktop */}
            <div className="hidden gap md:grid md:grid-cols-3 md:px-[14%]">
                {data.map((novel, index) => (
                    <BookCard
                        key={novel._id}
                        novel={novel}
                        imageUrls={imageUrls}
                        index={index}
                        showAnimation={true}
                    />
                ))}
            </div>

            {/* Giao diện cho Mobile */}
            <div className="md:hidden block mx-6 py-5">
                <Swiper
                modules={[Navigation, Pagination]}
                spaceBetween={30}
                slidesPerView={1}
                navigation
                pagination={{ clickable: true }}
                className="mySwiper"
                >
                {data.map((novel, index) => (
                    <SwiperSlide>
                        <div className="pt-5 pb-20">
                            <BookCard
                            key={novel._id}
                            novel={novel}
                            imageUrls={imageUrls}
                            index={index}
                            showAnimation={true}
                            />
                        </div>
                    </SwiperSlide>
                ))}
                </Swiper>
            </div>
        </div>
    );
};

export default FeatureBook;