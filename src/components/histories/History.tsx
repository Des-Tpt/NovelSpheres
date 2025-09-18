'use client'
import React, { useState, useMemo } from 'react';
import { useInfiniteQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from 'framer-motion';
import {
    History as HistoryIcon,
    BookOpen,
    Loader2,
    RefreshCw,
    AlertTriangle,
    ChevronUp
} from 'lucide-react';
import { getHistory } from "@/action/profileAction";
import LoadingComponent from '../ui/Loading';
import HistoryCard from './HistoryCard';
import HistoryFilter from './HistoryFilter';
import { useRouter } from 'next/navigation';

interface ApiResponse {
    histories: History[];
    pagination: {
        total: string;
        currentPage: string;
        totalPage: string;
        hasMore: boolean;
    }
}

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

interface FilterOptions {
    search: string;
    sortBy: 'lastRead' | 'title';
    sortOrder: 'asc' | 'desc';
    dateRange: 'all' | 'today' | 'week' | 'month' | 'year';
    status: 'all' | 'ongoing' | 'completed' | 'hiatus';
}

interface HistoriesProp {
    userId: string;
}

const Histories: React.FC<HistoriesProp> = ({ userId }) => {
    const [filters, setFilters] = useState<FilterOptions>({
        search: '',
        sortBy: 'lastRead',
        sortOrder: 'desc',
        dateRange: 'all',
        status: 'all'
    });
    const [showScrollTop, setShowScrollTop] = useState(false);
    const router = useRouter()

    const {
        data,
        error,
        isLoading,
        hasNextPage,
        fetchNextPage,
        isFetchingNextPage,
        refetch
    } = useInfiniteQuery<ApiResponse>({
        queryKey: ['historyPage', userId],
        queryFn: ({ pageParam = 1 }) => getHistory({ userId: userId, page: pageParam as number }),
        getNextPageParam: (lastPage, allPages) => {
            return lastPage.pagination.hasMore ? allPages.length + 1 : undefined;
        },
        initialPageParam: 1,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });

    // Flatten all histories from all pages
    const allHistories = useMemo(() => {
        return data?.pages.flatMap(page => page.histories) || [];
    }, [data]);

    // Apply filters
    const filteredHistories = useMemo(() => {
        let filtered = [...allHistories];

        // Search filter
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(history =>
                history.novels.title.toLowerCase().includes(searchLower) ||
                history.chapter.title.toLowerCase().includes(searchLower)
            );
        }

        // Status filter
        if (filters.status !== 'all') {
            filtered = filtered.filter(history =>
                history.novels.status.toLowerCase() === filters.status
            );
        }

        // Date range filter
        if (filters.dateRange !== 'all') {
            const now = new Date();
            const filterDate = new Date();

            switch (filters.dateRange) {
                case 'today':
                    filterDate.setHours(0, 0, 0, 0);
                    break;
                case 'week':
                    filterDate.setDate(now.getDate() - 7);
                    break;
                case 'month':
                    filterDate.setMonth(now.getMonth() - 1);
                    break;
                case 'year':
                    filterDate.setFullYear(now.getFullYear() - 1);
                    break;
            }

            filtered = filtered.filter(history =>
                new Date(history.lastReadAt) >= filterDate
            );
        }

        // Sort
        filtered.sort((a, b) => {
            let comparison = 0;

            switch (filters.sortBy) {
                case 'lastRead':
                    comparison = new Date(a.lastReadAt).getTime() - new Date(b.lastReadAt).getTime();
                    break;
                case 'title':
                    comparison = a.novels.title.localeCompare(b.novels.title, 'vi');
                    break;
            }

            return filters.sortOrder === 'asc' ? comparison : -comparison;
        });

        return filtered;
    }, [allHistories, filters]);

    // Calculate stats
    const stats = useMemo(() => {
        const uniqueNovels = new Set(allHistories.map(h => h.novels._id));
        const completedNovels = allHistories.filter(h => h.novels.status === 'completed');
        const totalChapters = allHistories.length;

        // Calculate reading streak (simplified)
        const sortedByDate = [...allHistories].sort((a, b) =>
            new Date(b.lastReadAt).getTime() - new Date(a.lastReadAt).getTime()
        );

        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < sortedByDate.length; i++) {
            const readDate = new Date(sortedByDate[i].lastReadAt);
            readDate.setHours(0, 0, 0, 0);

            const daysDiff = Math.floor((today.getTime() - readDate.getTime()) / (1000 * 60 * 60 * 24));

            if (daysDiff === streak) {
                streak++;
            } else if (daysDiff > streak) {
                break;
            }
        }

        return {
            totalNovels: uniqueNovels.size,
            totalChapters,
            readingStreak: streak,
            completedNovels: new Set(completedNovels.map(h => h.novels._id)).size,
        };
    }, [allHistories]);

    const handleNovelClick = (novelId: string) => {
        router.push(`/novels/${novelId}`);
    };

    const handleChapterClick = (novelId: string, chapterId: string) => {
        router.push(`/chapter/${chapterId}`);
    };

    const handleLoadMore = () => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Handle scroll event for scroll-to-top button
    React.useEffect(() => {
        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 400);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    if (isLoading) {
        return <LoadingComponent />;
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-950 pt-24 pb-12">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="bg-red-900/30 backdrop-blur-sm rounded-2xl border border-red-500/30 p-8 text-center">
                        <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-red-300 mb-2">
                            Không thể tải lịch sử đọc
                        </h2>
                        <p className="text-red-400 text-sm mb-6">{error.message}</p>
                        <button
                            onClick={() => refetch()}
                            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors font-medium flex items-center gap-2 mx-auto"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Thử lại
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const totalCount = data?.pages[0]?.pagination.total ? parseInt(data.pages[0].pagination.total) : 0;

    return (
        <div className="min-h-screen bg-gray-950 pt-3 md:pt-20 pb-12">
            <div className="max-w-6xl mx-auto px-4">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                                <HistoryIcon className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-white">Lịch sử đọc</h1>
                                <p className="text-gray-300 mt-1">
                                    Theo dõi tiến trình đọc truyện của bạn
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Filter Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <HistoryFilter
                        filters={filters}
                        onFiltersChange={setFilters}
                        totalCount={filteredHistories.length}
                    />
                </motion.div>

                {/* History List */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                            <BookOpen className="w-5 h-5" />
                            Danh sách lịch sử
                        </h2>
                        <span className="text-gray-400 text-sm">
                            {filteredHistories.length} / {totalCount} truyện
                        </span>
                    </div>

                    {filteredHistories.length > 0 ? (
                        <div className="space-y-4">
                            <AnimatePresence>
                                {filteredHistories.map((history, index) => (
                                    <HistoryCard
                                        key={history._id}
                                        history={history}
                                        index={index}
                                        onNovelClick={handleNovelClick}
                                        onChapterClick={handleChapterClick}
                                    />
                                ))}
                            </AnimatePresence>

                            {/* Load More Button */}
                            {hasNextPage && (
                                <div className="text-center pt-6">
                                    <button
                                        onClick={handleLoadMore}
                                        disabled={isFetchingNextPage}
                                        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-medium transition-all duration-300 flex items-center gap-2 mx-auto hover:shadow-lg hover:shadow-blue-500/25"
                                    >
                                        {isFetchingNextPage ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Đang tải...
                                            </>
                                        ) : (
                                            <>
                                                <RefreshCw className="w-5 h-5" />
                                                Xem thêm
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <HistoryIcon className="w-20 h-20 text-gray-600 mx-auto mb-6" />
                            <h3 className="text-xl font-semibold text-gray-400 mb-2">
                                {filters.search || filters.dateRange !== 'all' || filters.status !== 'all'
                                    ? 'Không tìm thấy lịch sử phù hợp'
                                    : 'Chưa có lịch sử đọc'}
                            </h3>
                            <p className="text-gray-500 max-w-md mx-auto">
                                {filters.search || filters.dateRange !== 'all' || filters.status !== 'all'
                                    ? 'Thử điều chỉnh bộ lọc để xem kết quả khác'
                                    : 'Bắt đầu đọc truyện để xây dựng lịch sử đọc của bạn'}
                            </p>
                        </div>
                    )}
                </motion.div>

                {/* Scroll to Top Button */}
                <AnimatePresence>
                    {showScrollTop && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            onClick={scrollToTop}
                            className="fixed bottom-8 right-8 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-50"
                        >
                            <ChevronUp className="w-6 h-6" />
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Histories;