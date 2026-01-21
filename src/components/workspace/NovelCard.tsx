"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, Heart, MessageCircle, FileText, Edit2, BookOpen, Clock } from 'lucide-react';
import getImage from '@/action/imageActions';
import handleStatus from '@/utils/handleStatus';
import CustomImage from '../ui/CustomImage';

const cloudname = process.env.NEXT_PUBLIC_CLOUDINARY_NAME! as string;
const defaultFallback = `https://res.cloudinary.com/${cloudname}/image/upload/LightNovel/BookCover/96776418_p0_qov0r8.png`;

interface NovelStats {
    published: number;
    drafts: number;
    words: number;
    views: number;
    likes: number;
    comments: number;
}

interface NovelCardProps {
    novel: {
        _id: string;
        title: string;
        status: string;
        state: string;
        coverImage?: { publicId: string; format: string };
        genresId?: Array<{ _id: string; name: string }>;
        updatedAt: string;
        stats: NovelStats;
    };
    index?: number;
}

const NovelCard: React.FC<NovelCardProps> = ({ novel, index = 0 }) => {
    const router = useRouter();
    const [coverImage, setCoverImage] = useState<string>(defaultFallback);

    useEffect(() => {
        if (novel.coverImage?.publicId && novel.coverImage?.format) {
            getImage(novel.coverImage.publicId, novel.coverImage.format)
                .then((res) => setCoverImage(res || defaultFallback))
                .catch(() => setCoverImage(defaultFallback));
        } else {
            setCoverImage(defaultFallback);
        }
    }, [novel.coverImage]);

    const formatNumber = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="bg-slate-900/90 backdrop-blur-sm rounded-xl border border-slate-700/50 hover:border-blue-500/40 transition-all duration-300 overflow-hidden group mb-4 shadow-sm hover:shadow-lg"
        >
            <div className="p-4 md:p-5">
                <div className="flex gap-4 md:gap-5">
                    {/* Cover Image */}
                    <div className="w-28 md:w-32 lg:w-36 flex-shrink-0">
                        <div className="relative aspect-[3/4] rounded-lg overflow-hidden border border-slate-600/50 group-hover:border-blue-500/40 transition-colors shadow-lg shadow-black/20">
                            <CustomImage
                                src={coverImage}
                                width={144}
                                height={192}
                                alt={novel.title}
                                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                            />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 flex flex-col">
                        {/* Header Row - Title left, Status/State/Date right */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="min-w-0 flex-1">
                                <h3
                                    className="text-2xl md:text-3xl font-bold text-white transition-colors line-clamp-2"
                                >
                                    {novel.title}
                                </h3>
                                {/* Genres */}
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {novel.genresId?.map((genre) => (
                                        <span
                                            key={genre._id}
                                            className="px-2.5 py-1 bg-purple-500/15 text-purple-300 border border-purple-500/25 rounded text-sm font-medium"
                                        >
                                            {genre.name}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Right corner: State, Status, Date */}
                            <div className="flex items-center gap-3 flex-shrink-0">
                                <span className={`px-2.5 py-1 rounded text-sm font-semibold ${novel.state === 'Published'
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                    }`}>
                                    {novel.state === 'Published' ? 'Công khai' : 'Nháp'}
                                </span>
                                <span className="px-2.5 py-1 bg-blue-500/15 text-blue-400 border border-blue-500/25 rounded text-sm font-semibold">
                                    {handleStatus(novel.status)}
                                </span>
                                <div className="flex items-center gap-1 text-xs text-blue-400 font-medium">
                                    <Clock size={11} />
                                    <span>{formatDate(novel.updatedAt)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3 mt-auto">
                            <div className="text-center p-2 bg-slate-800/50 rounded-lg border border-indigo-500/30">
                                <div className="text-xs text-gray-400 mb-1 flex items-center justify-center gap-1 font-medium">
                                    <FileText size={12} /> Tổng số từ
                                </div>
                                <div className="font-bold text-white text-sm md:text-base">{formatNumber(novel.stats.words)}</div>
                            </div>
                            <div className="text-center p-2 bg-slate-800/50 rounded-lg border border-green-500/30">
                                <div className="text-xs text-gray-400 mb-1 font-medium">Tổng số chương đã đăng</div>
                                <div className="font-bold text-green-400 text-sm md:text-base">{novel.stats.published}</div>
                            </div>
                            <div className="text-center p-2 bg-slate-800/50 rounded-lg border border-amber-500/30">
                                <div className="text-xs text-gray-400 mb-1 font-medium">Tổng số bản nháp</div>
                                <div className="font-bold text-amber-400 text-sm md:text-base">{novel.stats.drafts}</div>
                            </div>
                            <div className="text-center p-2 bg-slate-800/50 rounded-lg border border-emerald-500/30">
                                <div className="text-xs text-gray-400 mb-1 flex items-center justify-center gap-1 font-medium">
                                    <Eye size={12} /> Tổng số lượt xem
                                </div>
                                <div className="font-bold text-emerald-400 text-sm md:text-base">{formatNumber(novel.stats.views)}</div>
                            </div>
                            <div className="text-center p-2 bg-slate-800/50 rounded-lg border border-rose-500/30">
                                <div className="text-xs text-gray-400 mb-1 flex items-center justify-center gap-1 font-medium">
                                    <Heart size={12} /> Tổng số lượt thích
                                </div>
                                <div className="font-bold text-rose-400 text-sm md:text-base">{formatNumber(novel.stats.likes)}</div>
                            </div>
                            <div className="text-center p-2 bg-slate-800/50 rounded-lg border border-blue-500/30">
                                <div className="text-xs text-gray-400 mb-1 flex items-center justify-center gap-1 font-medium">
                                    <MessageCircle size={12} /> Tổng số lượt bình luận
                                </div>
                                <div className="font-bold text-blue-400 text-sm md:text-base">{formatNumber(novel.stats.comments)}</div>
                            </div>
                        </div>

                        <div className="flex justify-end items-center gap-2 mt-4">
                            <button
                                onClick={() => router.push(`/novels/${novel._id}`)}
                                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 hover:cursor-pointer text-white text-sm font-semibold py-2 px-4 rounded-lg transition-all duration-200 shadow-lg shadow-indigo-500/20"
                            >
                                <BookOpen size={15} />
                                <span>Xem truyện</span>
                            </button>
                            <button
                                onClick={() => router.push(`/workspace/novels/${novel._id}`)}
                                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-gray-300 hover:cursor-pointer hover:text-white text-sm font-medium py-2 px-4 rounded-lg transition-all duration-200 border border-slate-600"
                            >
                                <Edit2 size={15} />
                                <span>Quản lý</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default NovelCard;
