'use client'
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Eye, Heart, Star } from 'lucide-react';
import getImage from '@/action/imageActions';
import handleStatus from '@/utils/handleStatus';
import getStatusColor from '@/utils/getStatusColor';
import stripHtml from '@/utils/stripHtml';
import CustomImage from '../ui/CustomImage';

const cloudname = process.env.NEXT_PUBLIC_CLOUDINARY_NAME! as string;
const defaultFallback = `https://res.cloudinary.com/${cloudname}/image/upload/LightNovel/BookCover/96776418_p0_qov0r8.png`;

interface INovel {
    _id: string;
    title: string;
    authorId?: { username: string };
    description: string;
    coverImage?: {
        publicId?: string;
        format?: string;
    };
    genresId?: Array<{ _id: string; name: string }>;
    status: 'Ongoing' | 'Completed' | 'Hiatus';
    views: number;
    likes: number;
    rating: number;
    ratingsCount: number;
    createdAt: string;
    updatedAt: string;
}

interface NovelCardProps {
    novel: INovel;
    index: number;
    showAuthor?: boolean;
}

const NovelCard: React.FC<NovelCardProps> = ({ novel, index, showAuthor = false }) => {
    const router = useRouter();
    const [imageUrl, setImageUrl] = useState<string>(defaultFallback);

    // Load cover image
    useEffect(() => {
        if (novel.coverImage?.publicId) {
            const publicId = novel.coverImage.publicId;
            const format = novel.coverImage.format ?? 'jpg';

            getImage(publicId, format)
                .then((url) => {
                    if (url) {
                        setImageUrl(url);
                    } else {
                        setImageUrl(defaultFallback);
                    }
                })
                .catch(() => setImageUrl(defaultFallback));
        } else {
            setImageUrl(defaultFallback);
        }
    }, [novel.coverImage]);

    const formatNumber = (num: number): string => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor(diff / (1000 * 60 * 60));

        if (hours < 1) return 'Vừa xong';
        if (hours < 24) return `${hours} giờ trước`;
        if (days === 1) return 'Hôm qua';
        if (days < 7) return `${days} ngày trước`;
        return date.toLocaleDateString('vi-VN');
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: index * 0.1, ease: 'easeInOut' }}
            onClick={() => router.push(`/novels/${novel._id}`)}
            className="bg-gray-950 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-gray-800/50 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 cursor-pointer group"
        >
            {/* Mobile Layout (< sm) */}
            <div className="sm:hidden p-3">
                <div className="flex gap-3">
                    {/* Cover Image - Smaller on mobile */}
                    <div className="w-20 h-28 flex-shrink-0">
                        <CustomImage
                            src={imageUrl || defaultFallback}
                            height={112}
                            width={80}
                            alt={novel.title || 'Novel cover'}
                        />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        {/* Title and Status */}
                        <div className="mb-2">
                            <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors text-sm leading-tight line-clamp-2 mb-1">
                                {novel.title}
                            </h3>
                            <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-semibold ${getStatusColor(novel.status)}`}>
                                {handleStatus(novel.status)}
                            </span>
                        </div>

                        {/* Author - Mobile */}
                        {showAuthor && (
                            <div className="flex items-center gap-1 text-xs mb-2">
                                <span className="text-gray-500">của</span>
                                <span className="text-blue-400 font-medium truncate">
                                    {novel.authorId?.username || 'Ẩn danh'}
                                </span>
                            </div>
                        )}

                        {/* Description - Mobile */}
                        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-2">
                            {stripHtml(novel.description)}
                        </p>

                        {/* Genres - Mobile (Max 1-2) */}
                        <div className="flex flex-wrap gap-1 mb-2">
                            {novel.genresId?.slice(0, 1).map((genre) => (
                                <span
                                    key={genre._id}
                                    className="px-1.5 py-0.5 bg-gradient-to-r from-purple-600/20 to-blue-600/20 text-purple-300 border border-purple-500/30 rounded-full text-xs font-medium backdrop-blur-sm"
                                >
                                    {genre.name}
                                </span>
                            ))}
                            {novel.genresId && novel.genresId.length > 1 && (
                                <span className="px-1.5 py-0.5 bg-gray-700/50 text-gray-400 rounded-full text-xs backdrop-blur-sm">
                                    +{novel.genresId.length - 1}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stats - Mobile (Full width at bottom) */}
                <div className="mt-3 pt-2 border-t border-gray-800/50">
                    <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 text-emerald-400">
                                <Eye size={12} />
                                <span className="font-medium">{formatNumber(novel.views || 0)}</span>
                            </div>
                            <div className="flex items-center gap-1 text-rose-400">
                                <Heart size={12} />
                                <span className="font-medium">{formatNumber(novel.likes || 0)}</span>
                            </div>
                            <div className="flex items-center gap-1 text-yellow-400">
                                <Star size={12} />
                                <span className="font-medium">{Number(novel.rating || 0).toFixed(1)}</span>
                            </div>
                        </div>
                        <div className="text-gray-500 font-medium">
                            {formatDate(novel.updatedAt)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Desktop/Tablet Layout (>= sm) */}
            <div className="hidden sm:flex gap-4 lg:gap-6 p-4 lg:p-6">
                {/* Cover Image - Desktop */}
                <div className="w-24 h-32 md:w-28 md:h-40 lg:w-32 lg:h-48 flex-shrink-0">
                    <CustomImage
                        src={imageUrl || defaultFallback}
                        height={300}
                        width={200}
                        alt={novel.title || 'Novel cover'}
                    />
                </div>

                {/* Content - Desktop */}
                <div className="flex-1 flex flex-col justify-between min-h-0">
                    {/* Header */}
                    <div className="space-y-2 mb-3">
                        <div className="flex items-start justify-between gap-3">
                            <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors leading-tight text-base lg:text-lg line-clamp-2">
                                {novel.title}
                            </h3>
                            <span className={`px-2 py-1 rounded-lg text-sm font-semibold whitespace-nowrap flex-shrink-0 ${getStatusColor(novel.status)}`}>
                                {handleStatus(novel.status)}
                            </span>
                        </div>

                        {showAuthor && (
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-500">của</span>
                                <span className="text-blue-400 font-medium truncate">
                                    {novel.authorId?.username || 'Ẩn danh'}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Description - Desktop */}
                    <p className="text-sm lg:text-base text-gray-400 line-clamp-2 lg:line-clamp-3 leading-relaxed mb-3">
                        {stripHtml(novel.description)}
                    </p>

                    {/* Genres - Desktop */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                        {novel.genresId?.slice(0, 3).map((genre) => (
                            <span
                                key={genre._id}
                                className="px-2.5 py-1 bg-gradient-to-r from-purple-600/20 to-blue-600/20 text-purple-300 border border-purple-500/30 rounded-full text-xs font-medium backdrop-blur-sm"
                            >
                                {genre.name}
                            </span>
                        ))}
                        {novel.genresId && novel.genresId.length > 3 && (
                            <span className="px-2.5 py-1 bg-gray-700/50 text-gray-400 rounded-full text-xs backdrop-blur-sm">
                                +{novel.genresId.length - 3}
                            </span>
                        )}
                    </div>

                    {/* Stats - Desktop */}
                    <div className="mt-auto pt-3 border-t border-gray-800/50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-xs lg:text-sm">
                                <div className="flex items-center gap-1 text-emerald-400">
                                    <Eye size={14} />
                                    <span className="font-medium">{formatNumber(novel.views || 0)}</span>
                                </div>
                                <div className="flex items-center gap-1 text-rose-400">
                                    <Heart size={14} />
                                    <span className="font-medium">{formatNumber(novel.likes || 0)}</span>
                                </div>
                                <div className="flex items-center gap-1 text-yellow-400">
                                    <Star size={14} />
                                    <span className="font-medium">{Number(novel.rating || 0).toFixed(1)}</span>
                                </div>
                            </div>
                            <div className="text-xs lg:text-sm text-gray-500 font-medium">
                                {formatDate(novel.updatedAt)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default NovelCard;