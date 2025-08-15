"use client"
import React, { useEffect, useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Search, Grid, List, Eye, Heart, Star, BookOpen, Calendar, TrendingUp, Filter, X, RefreshCw, Plus, Edit3, Sparkles } from 'lucide-react';
import { getNovelsForNovelsPage, getGenres } from '@/action/novelActions';
import getImage from '@/action/imageActions';
import stripHtml from '@/utils/stripHtml';
import Image from 'next/image';
import handleStatus from '@/utils/handleStatus';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import getStatusColor from '@/utils/getStatusColor';
import CreateNovelPopup from './createNovel';
import { notifyError } from '@/utils/notify';
import { getUserFromCookies } from '@/action/userAction';

interface Genre {
    _id: string;
    name: string;
    description: string;
}

interface User {
    _id: string;
    username: string;
    profile: {
        avatar: {
            publicId: string;
            format: string;
        };
    };
    role: string;
}

interface Novel {
    _id: string;
    title: string;
    authorId: User;
    description: string;
    coverImage?: {
        publicId: string;
        format: string;
    };
    genresId: Genre[];
    status: 'Ongoing' | 'Completed' | 'Hiatus';
    views: number;
    likes: number;
    rating: number;
    createdAt: string;
    updatedAt: string;
}

interface ApiResponse {
    novel: Novel[];
    hasMore: boolean;
}

interface CurrentUser {
    _id: string;
    username: string;
    email: string;
    publicId: string;
    format: string;
    role: string;
}

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_NAME as string;

const NovelsPage = () => {
    const router = useRouter();
    // Current filters for display
    const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState<'title' | 'date' | 'views'>('date');

    // Pending filters (not yet applied)
    const [pendingGenres, setPendingGenres] = useState<string[]>([]);
    const [pendingSort, setPendingSort] = useState<'title' | 'date' | 'views'>('date');

    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
    const [showFilters, setShowFilters] = useState(false);

    const [isCreatePopupOpen, setIsCreatePopupOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

    // Check if there are pending changes
    const hasPendingChanges =
        JSON.stringify(pendingGenres.sort()) !== JSON.stringify(selectedGenres.sort()) ||
        pendingSort !== sortBy;

    // State for animation load NovelCard
    const [animationKey, setAnimationKey] = useState(0);

    // Separate query for genres
    const { data: genresData, isLoading: genresLoading } = useQuery({
        queryKey: ['genres'],
        queryFn: getGenres,
    });

    const { data, error, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, refetch } = useInfiniteQuery<ApiResponse>({
        queryKey: ['novels', selectedGenres, sortBy],
        //pageParam là biến của useInfiniteQuery, nó sẽ có tác dụng phụ trách phân trang, thay vì chúng ta phải tự khai báo state và tự xử lý logic.
        queryFn: ({ pageParam = 1 }) => getNovelsForNovelsPage({
            page: pageParam as number,
            genreIds: selectedGenres,
            sort: sortBy
        }),
        //LastPage là Array gần nhất vừa fetch về (ví dụ từ 5-10), còn allPages là toàn bộ Array đã fetch.
        getNextPageParam: (lastPage, allPages) => {
            return lastPage.hasMore ? allPages.length + 1 : undefined;
        },
        initialPageParam: 1,
    });

    // Extract data from pages - Fixed: Add fallback and ensure unique keys
    const novels = data?.pages.flatMap(page => page.novel).filter(novel => novel && novel._id) || [];
    const genres = genresData || [];

    // Calculate stats
    const totalViews = novels.reduce((sum, novel) => sum + (novel.views || 0), 0);
    const totalLikes = novels.reduce((sum, novel) => sum + (novel.likes || 0), 0);
    const avgRating = novels.length > 0 ? novels.reduce((sum, novel) => sum + (novel.rating || 0), 0) / novels.length : 0;

    // Handle pending genre filter change
    const handlePendingGenreChange = (genreId: string) => {
        setPendingGenres(prev =>
            prev.includes(genreId)
                ? prev.filter(id => id !== genreId)
                : [...prev, genreId]
        );
    };

    useEffect(() => {
        if (!data) return;
        setAnimationKey(prev => prev + 1);
    }, [data]);

    // Handle pending sort change
    const handlePendingSortChange = (newSort: 'title' | 'date' | 'views') => {
        setPendingSort(newSort);
    };

    // Apply filters
    const applyFilters = () => {
        setSelectedGenres(pendingGenres);
        setSortBy(pendingSort);
    };

    // Clear all filters
    const clearFilters = () => {
        setSelectedGenres([]);
        setSortBy('date');
        setPendingGenres([]);
        setPendingSort('date');
    };

    // Reset pending changes to current applied filters
    const resetPendingChanges = () => {
        setPendingGenres(selectedGenres);
        setPendingSort(sortBy);
    };

    // Initialize pending filters
    useEffect(() => {
        setPendingGenres(selectedGenres);
        setPendingSort(sortBy);
    }, []);

    const formatNumber = (num: number) => {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    useEffect(() => {
        if (!novels || novels.length === 0) return;

        const fetchImages = async () => {
            for (const novel of novels) {
                if (!novel || !novel.coverImage) continue;

                const publicId = novel.coverImage.publicId;
                const format = novel.coverImage.format ?? 'jpg';

                if (publicId && !imageUrls[publicId]) {
                    try {
                        const res = await getImage(publicId, format);
                        if (res) {
                            setImageUrls((prev) => ({ ...prev, [publicId]: res }));
                        }
                    } catch (error) {
                        console.error('Error fetching image for', publicId, error);
                    }
                }
            }
        };
        fetchImages();
    }, [novels, imageUrls]);

    useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                const response = await getUserFromCookies();
                if (response?.user) setCurrentUser(response?.user);
            } catch (error) {
                setCurrentUser(null);
            }
        };
        fetchCurrentUser();
    }, []);

    const handleCreateNovel = async () => {
        if (!currentUser) notifyError('Vui lòng đăng nhập!')
        else {
            setIsCreatePopupOpen(true);
        }
    }

    const handleRefresh = () => {
        refetch();
    };

    return (
        <>
            <div className="min-h-screen text-gray-100">
                {/* Header */}
                <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 border border-gray-400 rounded-xl mb-8">
                    <div className="max-w-7xl mx-auto px-6 py-8">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                            <div className="space-y-2">
                                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                    Tiểu Thuyết
                                </h1>
                                <p className="text-gray-300 text-lg">
                                    Khám phá thế giới văn học đầy màu sắc
                                </p>
                            </div>

                            {/* Controls */}
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={handleRefresh}
                                    disabled={isLoading}
                                    className="px-4 py-2 bg-gray-900 hover:bg-gray-700 border border-gray-600 hover:border-gray-500 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                                    {isLoading ? 'Đang tải...' : 'Làm mới'}
                                </button>

                                {/* Mobile Filter Toggle */}
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className="lg:hidden px-4 py-2 bg-gray-900 hover:bg-gray-700 border border-gray-600 hover:border-gray-500 rounded-lg transition-all duration-300 flex items-center gap-2"
                                >
                                    <Filter size={16} />
                                    Bộ lọc
                                </button>

                                <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-600">
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`p-2 rounded-md transition-all duration-300 ${viewMode === 'grid'
                                            ? 'bg-blue-600 text-white shadow-lg'
                                            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                                            }`}
                                    >
                                        <Grid size={20} />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`p-2 rounded-md transition-all duration-300 ${viewMode === 'list'
                                            ? 'bg-blue-600 text-white shadow-lg'
                                            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                                            }`}
                                    >
                                        <List size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Stats and Count Container */}
                        <div className="mt-6 pt-6 border-t border-gray-700">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                {/* Stats */}
                                <div className="flex items-center gap-6 text-sm text-gray-400">
                                    <div className="flex items-center gap-2">
                                        <BookOpen size={16} className="text-blue-400" />
                                        <span className="text-white font-semibold">{novels.length}</span> tiểu thuyết
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Eye size={16} className="text-green-400" />
                                        <span>{formatNumber(totalViews)} lượt xem</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Heart size={16} className="text-red-400" />
                                        <span>{formatNumber(totalLikes)} lượt thích</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Star size={16} className="text-yellow-400" />
                                        <span>{avgRating.toFixed(1)} điểm TB</span>
                                    </div>
                                </div>

                                {/* Sort Info */}
                                <div className="text-sm text-gray-400 flex justify-between md:justify-center items-center gap-5">
                                    <span>
                                        Sắp xếp: <span className="text-blue-400 font-medium">
                                            {sortBy === 'date' ? 'Mới nhất' : sortBy === 'title' ? 'Tên A-Z' : 'Lượt xem'}
                                        </span>
                                    </span>

                                    <motion.button
                                        onClick={handleCreateNovel}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="relative px-3 py-2 bg-gradient-to-r cursor-pointer from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 flex items-center gap-2.5 overflow-hidden group"
                                    >
                                        <div className="absolute inset-0 -top-40 -left-20 w-16 h-40 bg-white/20 rotate-45 transition-all duration-700 group-hover:left-full opacity-0 group-hover:opacity-100"></div>
                                        <div className="relative z-10 flex items-center gap-2.5">
                                            <div className="p-1 bg-white/20 rounded-lg">
                                                <Edit3 size={16} />
                                            </div>
                                            <span className="hidden sm:inline">Tạo tiểu thuyết</span>
                                            <span className="sm:hidden">Tạo mới</span>
                                            <Sparkles size={14} className="animate-pulse" />
                                        </div>
                                    </motion.button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full mx-auto">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Sidebar Filters */}
                        <div className={`lg:w-65 flex-shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                            <div className="bg-gray-950 rounded-xl shadow-xl border border-gray-700 p-6 sticky top-20">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                        <Filter size={20} className="text-blue-400" />
                                        Bộ lọc
                                    </h3>
                                    <button
                                        onClick={clearFilters}
                                        className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                                    >
                                        Đặt lại
                                    </button>
                                </div>

                                {/* Sort Options */}
                                <div className="mb-8">
                                    <h4 className="text-sm font-semibold text-gray-200 mb-4 flex items-center gap-2">
                                        <TrendingUp size={16} className="text-green-400" />
                                        Sắp xếp theo
                                    </h4>
                                    <div className="space-y-3">
                                        {[
                                            { value: 'date', label: 'Mới nhất', icon: Calendar },
                                            { value: 'title', label: 'Tên A-Z', icon: BookOpen },
                                            { value: 'views', label: 'Lượt xem', icon: Eye }
                                        ].map((option) => {
                                            const IconComponent = option.icon;
                                            return (
                                                <label key={option.value} className="flex items-center cursor-pointer group">
                                                    <input
                                                        type="radio"
                                                        name="sort"
                                                        value={option.value}
                                                        checked={pendingSort === option.value}
                                                        onChange={(e) => handlePendingSortChange(e.target.value as 'title' | 'date' | 'views')}
                                                        className="w-4 h-4 text-blue-600 border-gray-600 bg-gray-800 focus:ring-blue-500 focus:ring-2"
                                                    />
                                                    <div className="ml-3 flex items-center gap-2">
                                                        <IconComponent size={14} className="text-gray-400 group-hover:text-blue-400 transition-colors" />
                                                        <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                                                            {option.label}
                                                        </span>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Genre Filters */}
                                <div className="mb-6">
                                    <h4 className="text-sm font-semibold text-gray-200 mb-4 flex items-center gap-2">
                                        <Star size={16} className="text-purple-400" />
                                        Thể loại ({pendingGenres.length} đã chọn)
                                    </h4>
                                    {genresLoading ? (
                                        <div className="text-sm text-gray-400 py-4">
                                            <div className="animate-pulse flex space-x-4">
                                                <div className="flex-1 space-y-2">
                                                    <div className="h-4 bg-gray-700 rounded"></div>
                                                    <div className="h-4 bg-gray-700 rounded w-5/6"></div>
                                                    <div className="h-4 bg-gray-700 rounded w-4/6"></div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
                                            {genres.map((genre: Genre) => (
                                                <label key={`${genre._id}-novelspage`}
                                                    className="flex items-center cursor-pointer group hover:bg-gray-800 p-2 rounded-lg transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        checked={pendingGenres.includes(genre._id)}
                                                        onChange={() => handlePendingGenreChange(genre._id)}
                                                        className="w-4 h-4 text-blue-600 border-gray-600 bg-gray-800 rounded focus:ring-blue-500 focus:ring-2"
                                                    />
                                                    <span className="ml-3 text-sm text-gray-300 group-hover:text-white transition-colors">
                                                        {genre.name}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Apply/Reset Buttons */}
                                <div className="space-y-3 pt-4 border-t border-gray-700">
                                    <button
                                        onClick={applyFilters}
                                        disabled={!hasPendingChanges}
                                        className="w-full bg-blue-600 hover:bg-blue-700 z-20 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2"
                                    >
                                        <TrendingUp size={16} />
                                        Áp dụng bộ lọc
                                        {hasPendingChanges && (
                                            <span className="bg-blue-500 text-xs px-2 py-0.5 rounded-full">●</span>
                                        )}
                                    </button>

                                    {hasPendingChanges && (
                                        <motion.button
                                            initial={{ opacity: 0, y: -10, scale: 0.5 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            transition={{
                                                ease: 'easeInOut',
                                                duration: 0.1
                                            }}
                                            exit={{ opacity: 0, y: 30, scale: 0.5 }}
                                            onClick={resetPendingChanges}
                                            className="w-full bg-gray-700 hover:bg-gray-600 z-0 text-gray-300 px-4 py-2 rounded-lg font-medium transition-all duration-300"
                                        >
                                            Hủy thay đổi
                                        </motion.button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1">
                            {/* Error State */}
                            {isError && (
                                <div className="bg-red-900/50 border border-red-700 rounded-xl p-6 mb-6">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
                                            <X size={14} className="text-white" />
                                        </div>
                                        <h3 className="text-red-400 font-semibold">Có lỗi xảy ra</h3>
                                    </div>
                                    <p className="text-red-300 mb-4">
                                        {error instanceof Error ? error.message : 'Không thể tải dữ liệu tiểu thuyết'}
                                    </p>
                                    <button
                                        onClick={() => refetch()}
                                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                                    >
                                        Thử lại
                                    </button>
                                </div>
                            )}

                            {/* Loading State */}
                            {isLoading && (
                                <div className="text-center py-16">
                                    <div className="inline-flex items-center gap-4">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                        <p className="text-gray-400 text-lg">Đang tải tiểu thuyết...</p>
                                    </div>
                                </div>
                            )}

                            {/* Novels Grid/List */}
                            {novels.length > 0 && (
                                <>
                                    <div className={viewMode === 'grid'
                                        ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
                                        : "space-y-3"
                                    }>
                                        {novels.map((novel, index) => (
                                            <motion.div
                                                initial={{ opacity: 0, y: 30 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 30 }}
                                                transition={{ duration: index * 0.1, ease: 'easeInOut' }}
                                                key={`${novel._id}-${index}`}
                                                onClick={() => router.push(`/novels/${novel._id}`)}
                                                className={`bg-gray-950 backdrop-blur-sm rounded-2xl border border-gray-800/50 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 cursor-pointer group ${viewMode === 'list'
                                                    ? 'flex gap-4 p-4 sm:gap-6 sm:p-6'
                                                    : 'overflow-hidden flex flex-col h-auto'
                                                    }`}
                                            >
                                                {/* Cover Image */}
                                                <div className={
                                                    viewMode === 'list'
                                                        ? 'w-30 h-40 sm:w-32 sm:h-55 flex-shrink-0'
                                                        : 'relative overflow-hidden'
                                                }>
                                                    <Image
                                                        src={novel.coverImage?.publicId && imageUrls[novel.coverImage.publicId]
                                                            ? imageUrls[novel.coverImage.publicId]
                                                            : `https://res.cloudinary.com/${cloudName!}/image/upload/LightNovel/BookCover/96776418_p0_qov0r8.png`
                                                        }
                                                        height={300}
                                                        width={200}
                                                        alt={novel.title || 'Novel cover'}
                                                        className={`object-cover object-top transition-transform duration-300 group-hover:scale-110 ${viewMode === 'list' ? 'rounded-xl h-full' : 'rounded-t-2xl w-full h-60'
                                                            }`}
                                                    />
                                                    {viewMode === 'grid' && (
                                                        <>
                                                            {/* Gradient overlay */}
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                                                            {/* Status badge */}
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
                                                        </>
                                                    )}
                                                </div>

                                                {/* Content */}
                                                <div className={
                                                    viewMode === 'list'
                                                        ? 'flex-1 flex flex-col justify-between min-h-0'
                                                        : 'p-4 flex-1 flex flex-col'
                                                }>
                                                    {/* Header */}
                                                    <div className="space-y-2 mb-3">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <h3 className={`font-bold text-white group-hover:text-blue-400 transition-colors leading-tight ${viewMode === 'list' ? 'text-lg line-clamp-2' : 'text-lg line-clamp-2'
                                                                }`}>
                                                                {novel.title}
                                                            </h3>
                                                            {viewMode === 'list' && (
                                                                <span className={`px-2 py-1 rounded-lg text-sm font-semibold whitespace-nowrap flex-shrink-0 ${getStatusColor(novel.status)}`}>
                                                                    {handleStatus(novel.status)}
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center gap-2 text-[1rem]">
                                                            <span className="text-gray-500">của</span>
                                                            <span className="text-blue-400 font-medium truncate">
                                                                {novel.authorId?.username || 'Ẩn danh'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Description - Only show in list mode or larger screens */}
                                                    {(viewMode === 'list' || (typeof window !== 'undefined' && window.innerWidth > 640)) && (
                                                        <p className="text-xs sm:text-sm text-gray-400 line-clamp-2 sm:line-clamp-3 leading-relaxed mb-3">
                                                            {stripHtml(novel.description)}
                                                        </p>
                                                    )}

                                                    {/* Genres - Max 2 genres */}
                                                    <div className="flex flex-wrap gap-1.5 mb-3">
                                                        {novel.genresId?.slice(0, 2).map((genre) => (
                                                            <span
                                                                key={genre._id}
                                                                className="px-2.5 py-1 bg-gradient-to-r from-purple-600/20 to-blue-600/20 text-purple-300 border border-purple-500/30 rounded-full text-xs font-medium backdrop-blur-sm"
                                                            >
                                                                {genre.name}
                                                            </span>
                                                        ))}
                                                        {novel.genresId && novel.genresId.length > 2 && (
                                                            <span className="px-2.5 py-1 bg-gray-700/50 text-gray-400 rounded-full text-xs backdrop-blur-sm">
                                                                +{novel.genresId.length - 2}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Stats - Always at bottom */}
                                                    <div className="mt-auto pt-3 border-t border-gray-800/50">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3 text-xs">
                                                                <div className="flex items-center gap-1 text-emerald-400">
                                                                    <Eye size={12} />
                                                                    <span className="font-medium">{formatNumber(novel.views || 0)}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1 text-rose-400">
                                                                    <Heart size={12} />
                                                                    <span className="font-medium">{formatNumber(novel.likes || 0)}</span>
                                                                </div>
                                                                {viewMode === 'list' && (
                                                                    <div className="flex items-center gap-1 text-yellow-400">
                                                                        <Star size={12} />
                                                                        <span className="font-medium">{Number(novel.rating || 0).toFixed(1)}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="text-xs text-gray-500 font-medium">
                                                                {formatDate(novel.updatedAt)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>

                                    {/* Load More Button */}
                                    {hasNextPage && (
                                        <div className="text-center mt-12">
                                            <button
                                                onClick={() => fetchNextPage()}
                                                disabled={isFetchingNextPage}
                                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 inline-flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                                            >
                                                {isFetchingNextPage ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                        Đang tải thêm...
                                                    </>
                                                ) : (
                                                    <>
                                                        <BookOpen size={18} />
                                                        Xem thêm tiểu thuyết
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}

                                    {/* No More Results */}
                                    {!hasNextPage && novels.length > 0 && (
                                        <div className="text-center mt-12 py-8 border-t border-gray-700">
                                            <div className="text-gray-400 mb-2">
                                                <BookOpen size={24} className="mx-auto mb-2 opacity-50" />
                                            </div>
                                            <p className="text-gray-400">Đã hiển thị tất cả {novels.length} tiểu thuyết</p>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* No Results */}
                            {!isLoading && novels.length === 0 && (
                                <div className="text-center py-20 bg-gray-950 rounded-xl border border-gray-700">
                                    <div className="text-gray-500 mb-6">
                                        <Search size={64} className="mx-auto mb-4 opacity-50" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-3">
                                        Không tìm thấy tiểu thuyết nào
                                    </h3>
                                    <p className="text-gray-400 mb-6 max-w-md mx-auto">
                                        Có vẻ như không có tiểu thuyết nào phù hợp với bộ lọc hiện tại. Hãy thử điều chỉnh các tiêu chí tìm kiếm.
                                    </p>
                                    <button
                                        onClick={clearFilters}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                                        Xóa tất cả bộ lọc
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <AnimatePresence>
                {isCreatePopupOpen && currentUser && (
                    <CreateNovelPopup
                        isOpen={isCreatePopupOpen}
                        onClose={() => setIsCreatePopupOpen(false)}
                        userId={currentUser?._id}
                        genres={genresData}
                    />
                )}
            </AnimatePresence>
        </>
    );
}

export default NovelsPage;