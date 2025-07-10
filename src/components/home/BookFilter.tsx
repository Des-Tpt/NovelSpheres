'use client'
import getGenres from "@/action/getGenres";
import getNovelByFilter from "@/action/getNovelByFilter";
import { ArrowRightIcon, ArrowTrendingUpIcon, BookmarkIcon, BookOpenIcon, ClockIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import getImage from "@/action/getImage";
import INovelWithPopulate from "@/type/INovelWithPopulate";
import { random } from "lodash";
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { motion } from "framer-motion";
import Image from "next/image";
import LoadingComponent from "../ui/Loading";


type Genre = {
    _id: string;
    name: string;
}


const BookFilter = () => {
    //Lấy thể loại novel.
    const { data: genres, isLoading: isGenresLoading, error: genresError } = useQuery<Genre[] | null>({
        queryKey: ['genres-home'],
        queryFn: getGenres,
        staleTime: 1000 * 60 * 5,
        });

    const [selectedGenres, setSelectedGenres] = useState<Genre[]>([]);
    const [novels, setNovels] = useState<INovelWithPopulate[]>([]);
    const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
    const [sort, setSort] = useState<string>("views");

    const getTimeAgo = (updatedAt: string | Date) => {
        return `Cập nhật ${formatDistanceToNow(new Date(updatedAt), { addSuffix: true,  locale: vi })}`;
    }

    useEffect(() => {
        if (novels) {
            novels.map(async (novel) => {
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
    }, [novels]);

    const handleOnClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        const id = e.currentTarget.id;
        if (id !== sort) {
        setSort(id);}
    };

    //Lấy novel theo thể loại.
    useEffect (() => {
        const fetchData = async () => {
            try {
                const data = await getNovelByFilter(selectedGenres, sort);
                if (data) setNovels(data);
            } catch (err) {
                console.log(err);
            }
        }
        fetchData();
    }, [selectedGenres, sort])

    const toggleGenres = (genre: Genre) => {
        setSelectedGenres ((prev) =>
            prev.find((g) => g._id == genre._id) ? prev.filter((g) => g._id !== genre._id) : [...prev, genre]
        )
    }

    const handleTranslate = (en: string) => {
        switch(en) {
            case 'Completed' : return 'Hoàn thành';
            case 'Ongoing' : return 'Đang tiến hành'
            case 'Hiatus' : return 'Tạm ngưng'
        }
    }

    const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
    };
    
    if (isGenresLoading) return (<LoadingComponent/>);
    if (genresError instanceof Error) return <p>Lỗi: {genresError.message}</p>;
    if (!genres || genres.length === 0) return <p>Không có dữ liệu</p>;

    return (
    <div className="flex flex-wrap justify-center gap-1 bg-black px-2.5 md:bg-gradient-to-r md:from-black md:from-20% md:via-gray-950 md:via-75% md:to-black pt-[5%] pb-[5%]">
        <div className="w-full hidden md:flex md:flex-col md:mx-[14%] mx-10 p-4 rounded-2xl group hover:shadow hover:shadow-gray-400 hover:border-gray-400 transition-all duration-300">
            <h1 className="text-white mb-2 block text-3xl">Lọc theo thể loại</h1>
            {selectedGenres.length > 0 &&  
                <div className="flex gap-1.5 font-inter py-2.5 flex-wrap items-center pb-5">Đã chọn:
                    {   
                        selectedGenres.map(genre => (
                            <div key={genre._id} className="flex rounded-[3rem] px-3 pl-4 py-0.5 items-center" style={{ backgroundColor: "#242424" }}>
                                <button className='flex items-center cursor-pointer' onClick={() => toggleGenres(genre)}>{genre.name} <XMarkIcon className="w-3 h-3 ml-1"/></button>
                            </div>
                        ))
                    }
                    <button className='flex items-center cursor-pointer pl-3.5' onClick={() => setSelectedGenres([])}>Xóa hết tất cả</button>
                </div>
            }
            <div className="flex font-bold flex-wrap justify-center gap-3 sm:grid sm:grid-cols-5 sm:gap md:grid md:grid-cols-8 md:gap-2 ">
                {genres.map((genre) => (
                    <button key={genre._id} 
                    className={`cursor-pointer border border-gray-400 text-center text-[0.9rem] font-sans text-white hover:bg-gray-400 hover:text-black transition-all duration-300 rounded-[8px] py-1 w-[7rem] md:w-auto
                    ${selectedGenres.find((g) => g._id === genre._id)
                                    ? 'bg-gray-700 text-black'
                                    : 'hover:bg-white hover:text-black'}
                    `}
                    onClick={() => toggleGenres(genre)}
                    >{genre.name}
                    </button>
                ))}
            </div>
        </div>
        <div className="flex flex-col items-center py-10">
            <div className="w-auto h-auto pb-2.5">
                <div className="flex items-center border-2 border-gray-800 bg-gray-800 rounded-l-[0.4rem] rounded-r-[0.4rem]">
                    <button id="views" onClick={handleOnClick} className={`cursor-pointer px-4 py-2 w-[8rem] font-inter text-[0.9rem] justify-center items-center flex rounded-[0.4rem] text-sm font-medium transition ${sort === "views" ? "bg-black text-amber-600 shadow" : "bg-gray-800 text-white hover:bg-gray-200 transition-colors duration-200"}`}
                    ><ArrowTrendingUpIcon className="w-6 h-6 pr-2"/> Phổ biến</button>
                    <button id="updatedAt" onClick={handleOnClick} className={`cursor-pointer px-4 py-2 w-[8rem] font-inter text-[0.9rem] justify-center items-center rounded-[0.4rem] flex text-sm font-medium transition ${sort === "updatedAt" ? "bg-black text-amber-600 shadow" : "bg-gray-800 text-white hover:bg-gray-200 transition-colors duration-200"}`}>
                    <ClockIcon className="w-6 h-6 pr-2"/>Mới</button>
                    <button id="title" onClick={handleOnClick} className={`cursor-pointer px-4 py-2 w-[8rem] font-inter text-[0.9rem] justify-center items-center flex rounded-[0.4rem] text-sm font-medium transition ${sort === "title" ? "bg-black text-amber-600 shadow" : "bg-gray-800 text-white-600 hover:bg-gray-200 transition-colors duration-200"}`} >
                    <BookmarkIcon className="w-6 h-6 pr-2"/> A - Z</button>
                </div>
            </div>
            <div className="flex flex-col w-full max-w-[1400px] mx-auto">
                <div className="flex justify-between items-center py-5 md:px-6.5 md:py-0">
                    <span className="text-white mb-2 text-3xl">Tiểu thuyết phổ biến</span>
                    <button className="flex cursor-pointer text-amber-600 font-inter rounded-[10px] px-4 py-1.5 hover:bg-gray-600">
                        Xem tất cả <ArrowRightIcon className="pl-2 w-6 h-6"/>
                    </button>
                </div>
                
                <div className="grid grid-cols-2 gap-3 md:flex md:pt-6 md:gap-3 md:justify-center md:flex-wrap md:min-w-[1400px]">
                {novels.length > 0 ? novels.map(novel => (
                    <motion.div
                        key={novel._id.toString()}
                        className="flex flex-col cursor-pointer rounded-lg border border-gray-400 shadow-sm group shadow-gray-400 transition-transform duration-200 hover:-translate-y-1"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                    >
                    <a href={`novel-detailed?id=${novel._id}`}>
                        <div className="relative rounded-lg overflow-hidden">
                        <Image
                            src={
                                novel.coverImage?.publicId && imageUrls[novel.coverImage.publicId]
                                    ? imageUrls[novel.coverImage.publicId]
                                    : 'https://res.cloudinary.com/dr29oyoqx/image/upload/LightNovel/BookCover/96776418_p0_qov0r8.png'
                                }
                            width={200}
                            height={280}
                            alt={novel.title}
                            className="w-53 h-53 object-cover object-top"
                        />
                        <div className="flex">
                            <span className="rounded-2xl absolute bg-gray-600 py-0.25 px-2 font-semibold text-[0.75rem] top-2.5 left-2">
                            {novel.rating ? `⭐ ${novel.rating}` : 'Chưa có đánh giá'}
                            </span>
                            <span className="rounded-2xl absolute bg-gray-600 py-0.25 px-4 font-semibold top-2.5 text-[0.75rem] right-2">
                            {handleTranslate(novel.status)}
                            </span>
                        </div>
                        <div className="bg-black rounded-b-lg h-35 w-51 relative">
                            <div className="flex flex-col p-3">
                            <span className="font-semibold font text-[0.9rem] group-hover:text-amber-500 transition-colors line-clamp-1">{novel.title}</span>
                            <span className="font-inter text-[0.7rem] line-clamp-1">của {novel.authorName}</span>
                            <div className="flex justify-between">
                                <span className="text-[0.75rem] px-3 font-sans flex items-center font-bold justify-center absolute bottom-11.25 right-5 md:right-0.5">
                                {novel.firstGenreName}
                                </span>
                                <span className="text-[0.75rem] px-3 font-sans flex items-center font-bold justify-center absolute bottom-11 left-0.5">
                                <BookOpenIcon className="w-5 h-5 pr-1" />
                                {novel.chapterCount ? ` ${novel.chapterCount} chương` : ` ${random(1, 1000)} chương`}
                                </span>
                                <span className="text-[0.65rem] md:text-[0.72rem] px-3 font-sans flex items-center absolute bottom-4 left-0.5">
                                <ClockIcon className="w-5 h-5 pr-1"/>
                                {getTimeAgo(novel.updatedAt)}
                                </span>
                            </div>
                            </div>
                        </div>
                        </div>
                    </a>
                    </motion.div>
                )) : (
                    <div className="text-white text-sm italic">
                        Không có tiểu thuyết nào được tìm thấy.
                    </div>
                )}
                </div>
            </div>
        </div>    
    </div>
    )
}

export default BookFilter;
