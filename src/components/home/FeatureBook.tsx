'use client';
import { useQuery } from "@tanstack/react-query";
import { getFeatureNovels } from "@/action/novelActions";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import getImage from "@/action/imageActions";
import { ArrowRightIcon, BookOpenIcon } from "@heroicons/react/24/outline";
import { random } from "lodash";
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Navigation, Pagination } from 'swiper/modules';
import Image from "next/image";
import LoadingComponent from "../ui/Loading";
import handleStatus from "@/utils/handleStatus";
import { Sparkle } from "lucide-react";
import { useRouter } from "next/navigation";
import stripHtml from "@/utils/stripHtml";

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

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_NAME as string;

const BookCard: React.FC<BookCardProps> = ({ novel, imageUrls, index = 0, showAnimation = true }) => {
    const router = useRouter();

    const cardContent = (
        <div className="m-4 flex flex-col cursor-pointer rounded-lg shadow-gray-400 shadow-sm border border-gray-400 group hover:scale-105 hover:shadow-gray-400 hover:shadow-2xl duration-300 transition-all overflow-hidden"
            onClick={() => router.push(`/novels/${novel._id}`)}
        >
            <div className="relative rounded-t-lg overflow-hidden">
                <Image
                    src={novel.coverImage?.publicId && imageUrls[novel.coverImage.publicId]
                        ? imageUrls[novel.coverImage.publicId]
                        : `https://res.cloudinary.com/${cloudName!}/image/upload/LightNovel/BookCover/96776418_p0_qov0r8.png`
                    }
                    width={400}
                    height={400}
                    alt={novel.title}
                    className="w-full h-64 md:h-72 object-cover object-top"
                />
                <div className="flex">
                    <span className="rounded-2xl absolute bg-gray-800 bg-opacity-90 py-1 px-2 font-semibold text-sm top-3 left-3 text-white">
                        {novel.rating ? `⭐ ${novel.rating}` : 'Chưa có đánh giá'}
                    </span>
                    <span className="rounded-2xl absolute bg-gray-800 bg-opacity-90 py-1 px-2 font-semibold text-sm top-3 right-3 text-white">
                        {handleStatus(novel.status)}
                    </span>
                </div>
            </div>

            <div className="bg-black rounded-b-lg h-[220px] relative">
                <div className="flex flex-col p-4 h-full">
                    <h3 className="font-bold text-xl text-white group-hover:text-amber-500 transition-colors line-clamp-2 duration-300 mb-2">
                        {novel.title}
                    </h3>
                    <p className="text-gray-300 font-inter text-sm mb-3">
                        của {novel.authorName || 'Tác giả không xác định'}
                    </p>
                    <p className="text-gray-400 text-sm line-clamp-3 font-inter mb-4 flex-1">
                        {stripHtml(novel.description)}
                    </p>

                    <div className="flex justify-between items-center mt-auto pt-2">
                        <span className="rounded-full border border-amber-500 text-amber-500 px-3 py-1 text-xs font-medium">
                            {novel.firstGenreName}
                        </span>
                        <span className="rounded-full border border-gray-500 text-gray-300 px-3 py-1 text-xs flex items-center">
                            <BookOpenIcon className="w-4 h-4 mr-1" />
                            {novel.chapterCount ? `${novel.chapterCount}` : `${random(1, 1000)}`} ch
                        </span>
                    </div>
                </div>
            </div>
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

const FeatureBook = () => {
    const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

    const { data, isLoading, error } = useQuery<Novel[] | null>({
        queryKey: ['feature-novels'],
        queryFn: getFeatureNovels,
        staleTime: 1000 * 60 * 5,
    });

    useEffect(() => {
        if (!data) return;

        const fetchImages = async () => {
            for (const novel of data) {
                const publicId = novel.coverImage?.publicId;
                const format = novel.coverImage?.format ?? 'jpg';

                if (publicId && !imageUrls[publicId]) {
                    const res = await getImage(publicId, format);
                    if (res) {
                        setImageUrls((prev) => ({ ...prev, [publicId]: res }));
                    }
                }
            }
        };

        fetchImages();
    }, [data, imageUrls]);

    if (isLoading) return <LoadingComponent />;
    if (error instanceof Error) return <p className="text-red-500 text-center">Lỗi: {error.message}</p>;
    if (!data || data.length === 0) return <p className="text-gray-400 text-center">Không có dữ liệu</p>;

    return (
        <div className="flex flex-col pt-7 bg-black px-2.5 md:bg-gradient-to-r md:from-black md:from-20% md:via-gray-950 md:via-75% md:to-black">
            <div className="flex justify-between items-center pt-10 pb-2 md:pt-0 px-2">
                <div className="flex items-center gap-4 md:gap-5">
                    <Sparkle className="w-10 h-10 md:w-12 md:h-12 p-1.5 text-yellow-500 rounded-xl bg-gray-800" />
                    <div className="flex flex-col">
                        <h2 className="font-bold text-white text-lg md:text-2xl">Có thể bạn sẽ thích?</h2>
                        <p className="text-gray-400 text-sm md:text-base">Những tác phẩm được gợi ý ngẫu nhiên...</p>
                    </div>
                </div>

                <button className="flex items-center cursor-pointer text-amber-600 font-inter rounded-lg px-4 py-2 hover:bg-gray-800 transition-colors duration-200 whitespace-nowrap">
                    <span className="hidden sm:inline">Xem tất cả</span>
                    <ArrowRightIcon className="w-5 h-5 ml-1 sm:ml-2" />
                </button>
            </div>

            {/* Desktop Layout */}
            <div className="hidden md:grid md:grid-cols-4">
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

            {/* Mobile Layout */}
            <div className="md:hidden block py-5">
                <Swiper
                    modules={[Navigation, Pagination]}
                    spaceBetween={20}
                    slidesPerView={1}
                    navigation
                    pagination={{
                        clickable: true,
                        dynamicBullets: true
                    }}
                    className="mySwiper"
                >
                    {data.map((novel, index) => (
                        <SwiperSlide key={novel._id}>
                            <div className="pt-5 pb-12">
                                <BookCard
                                    novel={novel}
                                    imageUrls={imageUrls}
                                    index={index}
                                    showAnimation={false}
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