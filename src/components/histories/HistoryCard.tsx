'use client'
import React from 'react';
import { motion } from 'framer-motion';
import { Clock, BookOpen, Eye, Star, Calendar } from 'lucide-react';
import CustomImage from '../ui/CustomImage';
import getImage from '@/action/imageActions';
import { useState, useEffect } from 'react';

const cloudname = process.env.NEXT_PUBLIC_CLOUDINARY_NAME! as string;
const defaultFallback = `https://res.cloudinary.com/${cloudname}/image/upload/LightNovel/BookCover/96776418_p0_qov0r8.png`;

interface History {
    _id: string;
    novels: {
        _id: string;
        title: string;
        coverImage?: {
            publicId: string;
            format: string;
        }
        status: string;
        genres: Array<{ _id: string; name: string }>;
    };
    chapter: {
        _id: string;
        title: string;
        chapterNumber: number;
    };
    lastReadAt: Date;
}

interface HistoryCardProps {
    history: History;
    index: number;
    onNovelClick?: (novelId: string) => void;
    onChapterClick?: (novelId: string, chapterId: string) => void;
}

const HistoryCard: React.FC<HistoryCardProps> = ({
    history,
    index,
    onNovelClick,
    onChapterClick
}) => {
    const [coverUrl, setCoverUrl] = useState<string>(defaultFallback);

    useEffect(() => {
        const loadCoverImage = async () => {
            if (history.novels.coverImage?.publicId && history.novels.coverImage?.format) {
                try {
                    const url = await getImage(history.novels.coverImage.publicId, history.novels.coverImage.format);
                    setCoverUrl(url || defaultFallback);
                } catch (error) {
                    setCoverUrl(defaultFallback);
                }
            }
        };

        loadCoverImage();
    }, [history.novels.coverImage]);

    const formatDate = (dateString: string | Date): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor(diff / (1000 * 60));

        if (minutes < 1) return 'Vừa xong';
        if (minutes < 60) return `${minutes} phút trước`;
        if (hours < 24) return `${hours} giờ trước`;
        if (days === 1) return 'Hôm qua';
        if (days < 7) return `${days} ngày trước`;
        return date.toLocaleDateString('vi-VN');
    };

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'ongoing':
                return 'text-green-400';
            case 'completed':
                return 'text-blue-400';
            case 'hiatus':
                return 'text-yellow-400';
            default:
                return 'text-gray-400';
        }
    };

    const getStatusText = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'ongoing':
                return 'Đang tiến hành';
            case 'completed':
                return 'Hoàn thành';
            case 'hiatus':
                return 'Tạm dừng';
            default:
                return status;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl overflow-hidden hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300"
        >
            <div className="flex gap-4 p-4">
                {/* Cover Image */}
                <div
                    className="flex-shrink-0 cursor-pointer"
                    onClick={() => onNovelClick?.(history.novels._id)}
                >
                    <div className="w-20 h-28 rounded-lg overflow-hidden bg-gray-800 hover:scale-105 transition-transform duration-300">
                        <CustomImage
                            src={coverUrl}
                            alt={history.novels.title}
                            width={80}
                            height={112}
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex flex-col h-full justify-between">
                        {/* Novel Info */}
                        <div>
                            <h3
                                className="text-white font-semibold text-lg mb-1 cursor-pointer hover:text-blue-400 transition-colors truncate"
                                onClick={() => onNovelClick?.(history.novels._id)}
                            >
                                {history.novels.title}
                            </h3>

                            {/* Status and Genres */}
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`text-xs font-medium ${getStatusColor(history.novels.status)}`}>
                                    {getStatusText(history.novels.status)}
                                </span>
                                {history.novels.genres && history.novels.genres.length > 0 && (
                                    <>
                                        <span className="text-gray-500">•</span>
                                        <div className="flex gap-1 max-w-48 overflow-hidden">
                                            {history.novels.genres.slice(0, 2).map((genre, idx) => (
                                                <span
                                                    key={`${genre._id}-${idx}`}
                                                    className="text-xs text-gray-400 bg-gray-700/50 px-2 py-0.5 rounded truncate"
                                                >
                                                    {genre.name}
                                                </span>
                                            ))}
                                            {history.novels.genres.length > 2 && (
                                                <span className="text-xs text-gray-500">+{history.novels.genres.length - 2}</span>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Chapter Info */}
                            <div
                                className="flex items-center gap-2 mb-3 cursor-pointer group/chapter"
                                onClick={() => onChapterClick?.(history.novels._id, history.chapter._id)}
                            >
                                <BookOpen className="w-4 h-4 text-blue-400" />
                                <span className="text-blue-400 group-hover/chapter:text-blue-300 transition-colors">
                                    Chương {history.chapter.chapterNumber}: {history.chapter.title}
                                </span>
                            </div>
                        </div>

                        {/* Last Read Time */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                <Clock className="w-4 h-4" />
                                <span>Đọc {formatDate(history.lastReadAt)}</span>
                            </div>

                            {/* Continue Reading Button */}
                            <button
                                onClick={() => onChapterClick?.(history.novels._id, history.chapter._id)}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            >
                                Tiếp tục đọc
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default HistoryCard;