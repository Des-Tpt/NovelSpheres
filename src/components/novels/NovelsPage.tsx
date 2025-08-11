"use client"
import React, { useEffect, useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Search, Grid, List, Eye, Heart, Star } from 'lucide-react';
import { getNovelsForNovelsPage, getGenres } from '@/action/novelActions';
import getImage from '@/action/imageActions';

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
    coverImage?: {  // Make coverImage optional
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

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_NAME as string;

const NovelsPage = () => {
    const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState<'title' | 'date' | 'views'>('date');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

    // Separate query for genres
    const { data: genresData, isLoading: genresLoading } = useQuery({
        queryKey: ['genres'],
        queryFn: getGenres,
    });

    const {
        data,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
        refetch
    } = useInfiniteQuery<ApiResponse>({
        queryKey: ['novels', selectedGenres, sortBy],
        queryFn: ({ pageParam = 1 }) => getNovelsForNovelsPage({
            page: pageParam as number,
            genreIds: selectedGenres,
            sort: sortBy
        }),
        getNextPageParam: (lastPage, allPages) => {
            return lastPage.hasMore ? allPages.length + 1 : undefined;
        },
        initialPageParam: 1,
    });

    // Extract data from pages
    const novels = data?.pages.flatMap(page => page.novel) || [];
    const genres = genresData || [];

    // Handle genre filter change
    const handleGenreChange = (genreId: string) => {
        setSelectedGenres(prev =>
            prev.includes(genreId)
                ? prev.filter(id => id !== genreId)
                : [...prev, genreId]
        );
    };

    // Handle sort change
    const handleSortChange = (newSort: 'title' | 'date' | 'views') => {
        setSortBy(newSort);
    };

    // Clear all filters
    const clearFilters = () => {
        setSelectedGenres([]);
        setSortBy('date');
    };

    // Get status color
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Ongoing': return 'bg-green-100 text-green-800';
            case 'Completed': return 'bg-blue-100 text-blue-800';
            case 'Hiatus': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const formatNumber = (num: number) => {
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    };

    useEffect(() => {
        if (!novels || novels.length === 0) return;

        const fetchImages = async () => {
            for (const novel of novels) {
                // Add null/undefined checks
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
    }, [novels]); // Remove imageUrls from dependency array to prevent infinite loop

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Tiểu Thuyết</h1>
                            <p className="text-gray-600 mt-1">
                                Khám phá thế giới văn học đầy màu sắc
                            </p>
                        </div>

                        {/* View Toggle & Refresh */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => refetch()}
                                disabled={isLoading}
                                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 rounded-lg transition-colors"
                            >
                                {isLoading ? 'Đang tải...' : 'Làm mới'}
                            </button>

                            <div className="flex bg-gray-100 rounded-lg p-1">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                                        }`}
                                >
                                    <Grid size={20} />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                                        }`}
                                >
                                    <List size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Filters */}
                    <div className="lg:w-64 flex-shrink-0">
                        <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">Bộ lọc</h3>
                                <button
                                    onClick={clearFilters}
                                    className="text-sm text-blue-600 hover:text-blue-800"
                                >
                                    Xóa tất cả
                                </button>
                            </div>

                            {/* Sort Options */}
                            <div className="mb-6">
                                <h4 className="text-sm font-medium text-gray-700 mb-3">Sắp xếp theo</h4>
                                <div className="space-y-2">
                                    {[
                                        { value: 'date', label: 'Mới nhất' },
                                        { value: 'title', label: 'Tên A-Z' },
                                        { value: 'views', label: 'Lượt xem' }
                                    ].map((option) => (
                                        <label key={option.value} className="flex items-center">
                                            <input
                                                type="radio"
                                                name="sort"
                                                value={option.value}
                                                checked={sortBy === option.value}
                                                onChange={(e) => handleSortChange(e.target.value as 'title' | 'date' | 'views')}
                                                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Genre Filters */}
                            <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-3">Thể loại</h4>
                                {genresLoading ? (
                                    <div className="text-sm text-gray-500">Đang tải thể loại...</div>
                                ) : (
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                        {genres.map((genre: Genre) => (
                                            <label key={genre._id} className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedGenres.includes(genre._id)}
                                                    onChange={() => handleGenreChange(genre._id)}
                                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                />
                                                <span className="ml-2 text-sm text-gray-700">{genre.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1">
                        {/* Results Info */}
                        <div className="flex items-center justify-between mb-6">
                            <p className="text-gray-600">
                                {selectedGenres.length > 0 && (
                                    <span className="mr-2">
                                        Lọc theo: {selectedGenres.map(id => genres.find((g: Genre) => g._id === id)?.name).filter(Boolean).join(', ')}
                                    </span>
                                )}
                                Hiển thị {novels.length} tiểu thuyết
                            </p>
                        </div>

                        {/* Error State */}
                        {isError && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                                <p className="text-red-600">
                                    {error instanceof Error ? error.message : 'Có lỗi xảy ra khi tải dữ liệu'}
                                </p>
                                <button
                                    onClick={() => refetch()}
                                    className="mt-2 text-sm bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded transition-colors"
                                >
                                    Thử lại
                                </button>
                            </div>
                        )}

                        {/* Loading State */}
                        {isLoading && (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                                <p className="text-gray-600 mt-4">Đang tải...</p>
                            </div>
                        )}

                        {/* Novels Grid/List */}
                        {novels.length > 0 && (
                            <>
                                <div className={viewMode === 'grid'
                                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                                    : "space-y-6"
                                }>
                                    {novels.map((novel) => {
                                        // Add null check for novel
                                        if (!novel) return null;
                                        
                                        return (
                                            <div
                                                key={novel._id}
                                                className={`bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer ${viewMode === 'list' ? 'flex gap-4 p-4' : 'overflow-hidden'
                                                    }`}
                                            >
                                                {/* Cover Image */}
                                                <div className={viewMode === 'list' ? 'w-24 h-32 flex-shrink-0' : 'aspect-[3/4] w-full'}>
                                                    <img
                                                        src={novel.coverImage?.publicId && imageUrls[novel.coverImage.publicId]
                                                                ? imageUrls[novel.coverImage.publicId]
                                                                : `https://res.cloudinary.com/${cloudName!}/image/upload/LightNovel/BookCover/96776418_p0_qov0r8.png`
                                                        }
                                                        alt={novel.title || 'Novel cover'}
                                                        className="w-full h-full object-cover rounded-lg"
                                                        loading="lazy"
                                                    />
                                                </div>

                                                {/* Content */}
                                                <div className={viewMode === 'list' ? 'flex-1' : 'p-4'}>
                                                    <div className="flex items-start justify-between mb-2">
                                                        <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm">
                                                            {novel.title}
                                                        </h3>
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ml-2 whitespace-nowrap ${getStatusColor(novel.status)}`}>
                                                            {novel.status}
                                                        </span>
                                                    </div>

                                                    <p className="text-xs text-gray-600 mb-2">
                                                        Tác giả: {novel.authorId?.username || 'Unknown'}
                                                    </p>

                                                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                                                        {novel.description}
                                                    </p>

                                                    {/* Genres */}
                                                    <div className="flex flex-wrap gap-1 mb-3">
                                                        {novel.genresId?.slice(0, 2).map((genre) => (
                                                            <span
                                                                key={genre._id}
                                                                className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs"
                                                            >
                                                                {genre.name}
                                                            </span>
                                                        ))}
                                                        {novel.genresId && novel.genresId.length > 2 && (
                                                            <span className="px-2 py-1 bg-gray-50 text-gray-600 rounded-full text-xs">
                                                                +{novel.genresId.length - 2}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Stats */}
                                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                                        <div className="flex items-center gap-1">
                                                            <Eye size={12} />
                                                            <span>{formatNumber(novel.views || 0)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Heart size={12} />
                                                            <span>{formatNumber(novel.likes || 0)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Star size={12} />
                                                            <span>{Number(novel.rating || 0).toFixed(1)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Load More Button */}
                                {hasNextPage && (
                                    <div className="text-center mt-8">
                                        <button
                                            onClick={() => fetchNextPage()}
                                            disabled={isFetchingNextPage}
                                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-8 py-3 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                                        >
                                            {isFetchingNextPage ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                    Đang tải...
                                                </>
                                            ) : (
                                                'Xem thêm'
                                            )}
                                        </button>
                                    </div>
                                )}

                                {/* No More Results */}
                                {!hasNextPage && novels.length > 0 && (
                                    <div className="text-center mt-8 py-8 border-t">
                                        <p className="text-gray-500">Đã hiển thị tất cả kết quả</p>
                                    </div>
                                )}
                            </>
                        )}

                        {/* No Results */}
                        {!isLoading && novels.length === 0 && (
                            <div className="text-center py-12">
                                <div className="text-gray-400 mb-4">
                                    <Search size={48} className="mx-auto" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    Không tìm thấy tiểu thuyết nào
                                </h3>
                                <p className="text-gray-600 mb-4">
                                    Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
                                </p>
                                <button
                                    onClick={clearFilters}
                                    className="text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    Xóa tất cả bộ lọc
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NovelsPage;