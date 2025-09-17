'use client'
import { getGenres, getNovelByFilter } from "@/action/novelActions";
import { ArrowRightIcon, ArrowTrendingUpIcon, BookmarkIcon, BookOpenIcon, ClockIcon, XMarkIcon, StarIcon, FireIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import getImage from "@/action/imageActions";
import INovelWithPopulate from "@/type/INovelWithPopulate";
import { random } from "lodash";
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import LoadingComponent from "../ui/Loading";
import handleStatus from "@/utils/handleStatus";
import { useRouter } from "next/navigation";
import getStatusColor from '@/utils/getStatusColor';
import { Star } from "lucide-react";
import CustomImage from "../ui/CustomImage";


type Genre = {
    _id: string;
    name: string;
}

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_NAME as string;

const BookFilter = () => {
    const { data: genres, isLoading: isGenresLoading, error: genresError } = useQuery<Genre[] | null>({
        queryKey: ['genres-home'],
        queryFn: getGenres,
        staleTime: 1000 * 60 * 5,
    });

    const router = useRouter();
    const [selectedGenres, setSelectedGenres] = useState<Genre[]>([]);
    const [novels, setNovels] = useState<INovelWithPopulate[]>([]);
    const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
    const [sort, setSort] = useState<string>("views");
    const [animationKey, setAnimationKey] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const getTimeAgo = (updatedAt: string | Date) => {
        return `Cập nhật ${formatDistanceToNow(new Date(updatedAt), { addSuffix: true, locale: vi })}`;
    }

    useEffect(() => {
        if (!novels) return;

        const fetchImages = async () => {
            for (const novel of novels) {
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
    }, [novels]);

    const handleFilterName = (sort: string) => {
        switch (sort) {
            case "views": return "Tiểu thuyết phổ biến";
            case "updatedAt": return "Mới cập nhật";
            case "title": return "Theo thứ tự bảng chữ cái";
            default: return "Tiểu thuyết phổ biến";
        }
    }

    const getIconForSort = (sort: string) => {
        switch (sort) {
            case "views":
                return <FireIcon className="w-8 h-8 md:w-13 md:h-13 p-1.5 text-red-500 rounded-[0.8rem] bg-gray-800" />;
            case "updatedAt":
                return <SparklesIcon className="w-8 h-8 md:w-13 md:h-13 p-1.5 text-green-500 rounded-[0.8rem] bg-gray-800" />;
            case "title":
                return <BookmarkIcon className="w-8 h-8 md:w-13 md:h-13 p-1.5 text-blue-500 rounded-[0.8rem] bg-gray-800" />;
            default:
                return <StarIcon className="w-8 h-8 md:w-13 md:h-13 p-1.5 text-yellow-500 rounded-[0.8rem] bg-gray-800" />;
        }
    }

    const handleOnClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        const id = e.currentTarget.id;
        if (id !== sort) {
            setSort(id);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setAnimationKey(prev => prev + 1);
                setIsLoading(true);
                const data = await getNovelByFilter(selectedGenres, sort);
                if (data) setNovels(data);
            } catch (err) {
                console.log(err);
            } finally {
                setTimeout(() => {
                    setIsLoading(false);
                }, 10);
            }
        }
        fetchData();
    }, [selectedGenres, sort])

    const toggleGenres = (genre: Genre) => {
        setSelectedGenres((prev) =>
            prev.find((g) => g._id == genre._id) ? prev.filter((g) => g._id !== genre._id) : [...prev, genre]
        )
    }

    if (isGenresLoading) return (<LoadingComponent />);
    if (genresError instanceof Error) return <p>Lỗi: {genresError.message}</p>;
    if (!genres || genres.length === 0) return <p>Không có dữ liệu</p>;

    return (
        <div className="flex flex-wrap justify-center gap-1 bg-black md:bg-gradient-to-r md:from-black md:from-20% md:via-gray-950 md:via-75% md:to-black pt-[5%] pb-[5%]">
            {/* Genre Filter Section - Hidden on mobile */}
            <div className="w-full hidden md:flex md:flex-col mx-3 p-4 rounded-2xl group hover:shadow hover:shadow-gray-400 hover:border-gray-400 transition-all duration-300">
                <h1 className="text-white mb-2 block text-3xl">Lọc theo thể loại</h1>
                {selectedGenres.length > 0 && (
                    <div className="flex gap-1.5 font-inter py-2.5 flex-wrap items-center pb-5 text-white">
                        Đã chọn:
                        {selectedGenres.map(genre => (
                            <div key={genre._id} className="flex rounded-[3rem] px-3 pl-4 py-0.5 items-center" style={{ backgroundColor: "#242424" }}>
                                <button className='flex items-center cursor-pointer text-white hover:text-gray-300' onClick={() => toggleGenres(genre)}>
                                    {genre.name} <XMarkIcon className="w-3 h-3 ml-1" />
                                </button>
                            </div>
                        ))}
                        <button className='flex items-center cursor-pointer pl-3.5 text-amber-600 hover:text-amber-400' onClick={() => setSelectedGenres([])}>
                            Xóa hết tất cả
                        </button>
                    </div>
                )}
                <div className="flex font-bold flex-wrap justify-center gap-3 sm:grid sm:grid-cols-5 sm:gap md:grid md:grid-cols-8 md:gap-2">
                    {genres.map((genre) => (
                        <button key={genre._id}
                            className={`cursor-pointer border border-gray-400 text-center text-[0.9rem] font-sans text-white hover:bg-gray-400 hover:text-black transition-all duration-300 rounded-[8px] py-1 w-[7rem] md:w-auto
                            ${selectedGenres.find((g) => g._id === genre._id)
                                    ? 'bg-gray-400 text-black'
                                    : 'hover:bg-white hover:text-black'}
                            `}
                            onClick={() => toggleGenres(genre)}
                        >
                            {genre.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content Section */}
            <div className="flex flex-col items-center py-10 w-full">
                {/* Mobile sort */}
                <div className="w-full max-w-sm md:hidden pb-2.5 px-2 md:px-0">
                    <div className="flex items-center border-2 border-gray-800 bg-gray-800 rounded-[0.4rem] text-xs md:text-[0.9rem] w-full">
                        <button
                            id="views"
                            onClick={handleOnClick}
                            className={`cursor-pointer px-2 md:px-4 py-2 flex-1 md:w-[8rem] font-inter justify-center items-center flex rounded-[0.4rem] text-[0.7rem] md:text-sm font-medium transition ${sort === "views" ? "bg-black text-amber-600 shadow" : "bg-gray-800 text-white hover:bg-gray-600 hover:text-white transition-colors duration-200"}`}
                        >
                            <ArrowTrendingUpIcon className="w-4 h-4 md:w-6 md:h-6 md:pr-2" />
                            <span className="hidden xs:inline ml-1 md:ml-0">Phổ biến</span>
                        </button>
                        <button
                            id="updatedAt"
                            onClick={handleOnClick}
                            className={`cursor-pointer px-2 md:px-4 py-2 flex-1 md:w-[8rem] font-inter justify-center items-center rounded-[0.4rem] flex text-[0.7rem] md:text-sm font-medium transition ${sort === "updatedAt" ? "bg-black text-amber-600 shadow" : "bg-gray-800 text-white hover:bg-gray-600 hover:text-white transition-colors duration-200"}`}
                        >
                            <ClockIcon className="w-4 h-4 md:w-6 md:h-6 md:pr-2" />
                            <span className="hidden xs:inline ml-1 md:ml-0">Mới</span>
                        </button>
                        <button
                            id="title"
                            onClick={handleOnClick}
                            className={`cursor-pointer px-2 md:px-4 py-2 flex-1 md:w-[8rem] font-inter justify-center items-center flex rounded-[0.4rem] text-[0.7rem] md:text-sm font-medium transition ${sort === "title" ? "bg-black text-amber-600 shadow" : "bg-gray-800 text-white hover:bg-gray-600 hover:text-white transition-colors duration-200"}`}
                        >
                            <BookmarkIcon className="w-4 h-4 md:w-6 md:h-6 md:pr-2" />
                            <span className="hidden xs:inline ml-1 md:ml-0">A - Z</span>
                        </button>
                    </div>
                </div>

                <div className="w-auto h-auto pb-2.5">
                    <div className="hidden md:flex items-center border-2 border-gray-800 bg-gray-800 rounded-l-[0.4rem] text-xs md:text-[0.9rem] rounded-r-[0.4rem]">
                        <button id="views" onClick={handleOnClick} className={`cursor-pointer px-4 py-2 w-[8rem] font-inter justify-center items-center flex rounded-[0.4rem] text-sm font-medium transition ${sort === "views" ? "bg-black text-amber-600 shadow" : "bg-gray-800 text-white hover:bg-gray-600 hover:text-white transition-colors duration-200"}`}>
                            <ArrowTrendingUpIcon className="w-6 h-6 pr-2" /> Phổ biến
                        </button>
                        <button id="updatedAt" onClick={handleOnClick} className={`cursor-pointer px-4 py-2 w-[8rem] font-inter justify-center items-center rounded-[0.4rem] flex text-sm font-medium transition ${sort === "updatedAt" ? "bg-black text-amber-600 shadow" : "bg-gray-800 text-white hover:bg-gray-600 hover:text-white transition-colors duration-200"}`}>
                            <ClockIcon className="w-6 h-6 pr-2" />Mới
                        </button>
                        <button id="title" onClick={handleOnClick} className={`cursor-pointer px-4 py-2 w-[8rem] font-inter justify-center items-center flex rounded-[0.4rem] text-sm font-medium transition ${sort === "title" ? "bg-black text-amber-600 shadow" : "bg-gray-800 text-white hover:bg-gray-600 hover:text-white transition-colors duration-200"}`}>
                            <BookmarkIcon className="w-6 h-6 pr-2" /> A - Z
                        </button>
                    </div>
                </div>

                {/* Title and View All Section */}
                <div className="flex flex-col w-full max-w-[1400px] px-2">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-5 md:py-0 gap-3 sm:gap-0">
                        <div className="flex items-center gap-3 md:gap-4">
                            {getIconForSort(sort)}
                            <div className="flex flex-col">
                                <h2 className="text-white text-xl md:text-2xl font-bold flex-shrink-0">
                                    {handleFilterName(sort)}
                                </h2>
                                <span className="text-gray-400 text-sm md:text-base">
                                    {sort === "views" && "Những tác phẩm được yêu thích nhất"}
                                    {sort === "updatedAt" && "Cập nhật gần đây nhất"}
                                    {sort === "title" && "Sắp xếp theo bảng chữ cái"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Content Grid */}
                    <div className="w-full flex justify-center min-h-[400px]">
                        <AnimatePresence mode="wait">
                            {isLoading ? (
                                <motion.div
                                    key="loading"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex items-center justify-center h-64"
                                >
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key={animationKey}
                                    className="grid grid-cols-2 gap-3 md:grid-cols-6 md:gap-3 md:pt-6 max-w-[1400px] w-full"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {novels.length > 0 ? novels.map((novel, index) => (
                                        <motion.div
                                            key={novel._id.toString()}
                                            className="flex flex-col cursor-pointer rounded-lg border border-gray-700 group hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.4, ease: 'easeOut', delay: 0.05 * index }}
                                            onClick={() => router.push(`/novels/${novel._id}`)}
                                        >
                                            <div className=" rounded-lg overflow-hidden">
                                                <div className="relative">
                                                    <div className="h-50">
                                                        <CustomImage
                                                            src={
                                                                novel.coverImage?.publicId && imageUrls[novel.coverImage.publicId]
                                                                    ? imageUrls[novel.coverImage.publicId]
                                                                    : `https://res.cloudinary.com/${cloudName!}/image/upload/LightNovel/BookCover/96776418_p0_qov0r8.png`
                                                            }
                                                            width={200}
                                                            height={280}
                                                            alt={novel.title}
                                                            className="w-full object-cover object-top"
                                                        />
                                                    </div>
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                                                    <div className="absolute bottom-3 right-3">
                                                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold backdrop-blur-sm ${getStatusColor(novel.status)}`}>
                                                            {handleStatus(novel.status)}
                                                        </span>
                                                    </div>
                                                    {/* Rating badge */}
                                                    <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg">
                                                        <Star size={12} className="text-yellow-400 fill-current" />
                                                        <span className="text-white text-xs font-semibold">
                                                            {Number(novel.rating || 0).toFixed(1)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="bg-black rounded-b-lg relative">
                                                    <div className="flex flex-col p-3 space-y-1">
                                                        <span className="font-semibold text-[0.9rem] md:text-[1rem] line-clamp-1 text-white group-hover:text-blue-400 transition-colors leading-tight">
                                                            {novel.title}
                                                        </span>
                                                        <span className="text-[0.8rem] md:text-[0.9rem] line-clamp-1">
                                                            của <span className="text-blue-400">{novel.authorName}</span>
                                                        </span>
                                                        <div className="flex flex-col space-y-1 pt-2">
                                                            <div className="flex justify-between items-center">
                                                                <span className="px-2.5 py-1 bg-gradient-to-r from-purple-600/20 to-blue-600/20 text-purple-300 border border-purple-500/30 rounded-full text-xs font-medium backdrop-blur-sm"
                                                                >
                                                                    {novel.firstGenreName}
                                                                </span>
                                                                <span className="text-[0.85rem] text-gray-300 flex items-center">
                                                                    <BookOpenIcon className="w-4 h-4 mr-1" />
                                                                    {novel.chapterCount ? `${novel.chapterCount}` : `${random(1, 1000)}`} ch
                                                                </span>
                                                            </div>
                                                            <div className="text-[0.8rem] line-clamp-1 text-gray-400 flex items-center">
                                                                <ClockIcon className="w-4 h-4" />
                                                                <span className="pl-1 pt-0.5 line-clamp-1">{getTimeAgo(novel.updatedAt)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )) : (
                                        <div className="col-span-full text-white text-center py-12">
                                            <p className="text-lg">Không có tiểu thuyết nào được tìm thấy.</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default BookFilter;