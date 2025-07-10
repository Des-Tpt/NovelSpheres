'use client'
import { useEffect, useState } from "react";
import debounce from 'lodash.debounce';
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import './SearchBar.css';
import { motion, AnimatePresence } from "framer-motion";
import { random } from "lodash";
import getImage from "@/action/getImage";
import Image from "next/image";

type Novel = {
    _id: string;
    title: string;
    coverImage?: CoverImage;
    authorId?: User;
    rating?: number;
    genresId?: Genre[];
    chapterCount?: number;
}

type Genre = {
    _id: string;
    name: string;
}

type User = {
    _id: string;
    username: string;
};

type CoverImage = {
    publicId: string;
    format: string;
};

const SearchBar = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Novel[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showNoResult, setShowNoResult] = useState(false);
    const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

    const fetchResult = async (text:string) => {
        setIsSearching(true);
        try{
            const res = await fetch(`/api/search?query=${encodeURIComponent(text)}`); //Tìm đến file route.tsx để gửi query về cho MongoDB.
            const dataRes = await res.json();
            setResults(dataRes);
        } catch (error) {
            console.error('Lỗi:', error);
            setResults([]);
        } finally {
            setIsSearching(false);
        }
    }

    const debouncedSearching = debounce((value: string) => {
        if (value.trim()) {
            fetchResult(value);
        } else {
            setResults([]);
        }
    }, 500);

    useEffect(() => {
        debouncedSearching(query);
        return debouncedSearching.cancel //Nếu query thay đổi, thì hàm debouncedSearching sẽ bị hủy ngay lập tức và chạy lại.
    }, [query])

    useEffect(() => {
        results.map(async (novel) => {
            const publicId = novel.coverImage?.publicId;
            const format = novel.coverImage?.format ?? 'jpg';
            if (publicId && !imageUrls[publicId]) {
                const res = await getImage(publicId, format);
                if (res) {
                    setImageUrls((prev) => ({ ...prev, [publicId]: res }));
                }
            }
        });
    }, [results]);

    // Delay cái "Không tìm thấy kết quả!", mục tiêu là để hạn chế hiện lên pop-up
    useEffect(() => {
        if (!isSearching && query.trim() !== '' && results.length === 0) {
            const timer = setTimeout(() => {
                setShowNoResult(true);
            }, 500); // Delay nửa giây.
            return () => clearTimeout(timer);
        } else {
            setShowNoResult(false);
        }
    }, [query, isSearching, results]);

    // Animatiom của dropdown
    const dropdownVariants = {
        hidden: { opacity: 0, y: -10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' as const } },
        exit: { opacity: 0, y: -10, transition: { duration: 0.2, ease: 'easeIn' as const} },
    };

    const renderContent = () => {
        return (
            <ul className="result">
                {results.length > 0 ? (
                    results.map((novel) => (
                        <li className="novel-container" key={novel._id}>
                            <div className="flex items-center gap-2">
                                {novel.coverImage && imageUrls[novel.coverImage.publicId] && (
                                <Image
                                    src={imageUrls[novel.coverImage.publicId]}
                                    alt={novel.title}
                                    width={200}
                                    height={280}
                                    className="max-w-[38px] max-h-[72px] object-cover rounded m-0.5 mr-2"
                                />
                                )}
                                <div className="flex-1 flex justify-between items-center">
                                <div className="flex flex-col">
                                    <span className="font-bold font-inter line-clamp-1 text-[0.9rem]">{novel.title}</span>
                                    <div className="flex items-center font-sans text-[0.9rem]">
                                        <span className="text-muted-foreground">của {novel.authorId?.username || 'Chưa có tác giả'}</span>
                                        <span className="text-[10px] mx-2.5">● </span>
                                        <span className="text-[12px]">{novel.rating ? `⭐ ${novel.rating.toFixed(1)}` : 'Chưa có đánh giá'} </span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="border-solid border-1 rounded-[20px] px-2 py-0.75 text-[13.5px] font-semibold mb-1">{novel.genresId ? novel.genresId[0].name : ''}</span>
                                    <span className="text-[12px] mr-">{novel.chapterCount ? ` ${novel.chapterCount} ch` : ` ${random(1, 100)} ch`}</span>
                                </div>
                                </div>
                            </div>
                        </li>
                    ))
                ) : (
                showNoResult && (
                    <li className="novel-container">
                        <div className="no-result">
                            <span>Không tìm thấy kết quả!</span>
                        </div>
                    </li>
                )
                )}
            </ul>
        )
    }

    return ( 
        <div className="relative w-full">
            <div className="SearchBar"> 
            <MagnifyingGlassIcon className="w-0.5 h-0.5"/>
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Vui lòng nhập tên tiểu thuyết cần tìm..."
                className="input"
            />
            {/* Search cho PC*/}
            <AnimatePresence>
                {(results.length > 0 || showNoResult) && (
                <div className="hidden md:block">
                    <motion.div
                        className="dropdown"
                        variants={dropdownVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        >
                        {renderContent()}
                    </motion.div>
                </div>
                )}
            </AnimatePresence>
        </div>
        
        {/* Search cho di động*/}
        <AnimatePresence>
            <div className="block md:hidden">
            {(results.length > 0 || showNoResult) && (
                <motion.div
                    className="dropdown"
                    variants={dropdownVariants}
                    initial='hidden'
                    animate="visible"
                    exit="exit"
                    >
                    {renderContent()}
                </motion.div>
            )}
            </div>
        </AnimatePresence>
    </div>
    );
}

export default SearchBar;