'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Book, Clock, Menu, X } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getChapterById } from '@/action/chapterAction';

interface Novel {
    _id: string;
    title: string;
    coverImage?: {
        publicId: string;
        format: string;
    };
    author: {
        _id: string;
        username: string;
    };
}

interface ChapterInAct {
    _id: string;
    chapterNumber: number;
    title: string;
}

interface Act {
    _id: string;
    actNumber: number;
    actType?: string;
    title?: string;
}

interface ActWithChapters {
    _id: string;
    actNumber: number;
    title: string;
    actType?: string;
    chapters: ChapterInAct[];
}

interface Chapter {
    _id: string;
    title: string;
    content: string;
    chapterNumber: number;
    wordCount?: number;
    createdAt: string;
    updatedAt: string;
}

interface NavigationChapter {
    chapterId: string;
    actId: string;
    actNumber: number;
    chapterNumber: number;
}

interface Navigation {
    prevChapter: NavigationChapter | null;
    nextChapter: NavigationChapter | null;
    hasNext: boolean;
    hasPrev: boolean;
}

interface ChapterData {
    novel: Novel;
    act: Act;
    chapter: Chapter;
    navigation: Navigation;
    acts: ActWithChapters[];
    chaptersInAct: ChapterInAct[];
}

const ChapterPage = () => {
    const router = useRouter();
    const params = useParams();
    const chapterId = params.chapterId as string;
    const queryClient = useQueryClient();

    const [showTOC, setShowTOC] = useState<boolean>(false);
    const [fontSize, setFontSize] = useState<number>(16);
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');

    const { data, isLoading, error, refetch } = useQuery<ChapterData>({
        queryKey: ['chapter', chapterId],
        queryFn: () => getChapterById(chapterId),
        enabled: !!chapterId, // Chỉ chạy query khi có chapterId
        staleTime: 5 * 60 * 1000, // Cache trong 5 phút
        retry: 2, // Thử lại tối đa 2 lần nếu thất bại
    });

    // Prefetch chapters kế tiếp để tăng performance
    useEffect(() => {
        if (data?.navigation?.nextChapter) {
            queryClient.prefetchQuery({
                queryKey: ['chapter', data.navigation.nextChapter.chapterId],
                queryFn: () => getChapterById(data.navigation.nextChapter!.chapterId),
                staleTime: 5 * 60 * 1000,
            });
        }

        if (data?.navigation?.prevChapter) {
            queryClient.prefetchQuery({
                queryKey: ['chapter', data.navigation.prevChapter.chapterId],
                queryFn: () => getChapterById(data.navigation.prevChapter!.chapterId),
                staleTime: 5 * 60 * 1000,
            });
        }
    }, [data?.navigation, queryClient]);

    const navigateToChapter = (targetChapterId: string) => {
        router.push(`/chapter/${targetChapterId}`);
    };

    const goToPrevChapter = () => {
        if (data?.navigation?.prevChapter) {
            navigateToChapter(data.navigation.prevChapter.chapterId);
        }
    };

    const goToNextChapter = () => {
        if (data?.navigation?.nextChapter) {
            navigateToChapter(data.navigation.nextChapter.chapterId);
        }
    };

    const toggleFontSize = () => {
        setFontSize(prev => {
            if (prev === 16) return 18;
            if (prev === 18) return 20;
            return 16;
        });
    };

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'ArrowLeft' && data?.navigation?.hasPrev) {
            goToPrevChapter();
        } else if (event.key === 'ArrowRight' && data?.navigation?.hasNext) {
            goToNextChapter();
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Đang tải chương...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-md mx-auto">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Có lỗi xảy ra</h2>
                    <p className="text-gray-600 mb-4">
                        {error instanceof Error ? error.message : 'Không thể tải dữ liệu'}
                    </p>
                    <button
                        onClick={() => refetch()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    // No data state
    if (!data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <p className="text-gray-600">Không tìm thấy dữ liệu chương</p>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`min-h-screen transition-colors ${theme === 'dark' ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'
                }`}
            onKeyDown={handleKeyDown}
            tabIndex={0}
        >
            {/* Header */}
            <header className={`sticky top-0 z-40 border-b transition-colors ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                <div className="max-w-4xl mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => setShowTOC(!showTOC)}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                aria-label="Toggle table of contents"
                            >
                                {showTOC ? <X size={20} /> : <Menu size={20} />}
                            </button>
                            <div>
                                <h1 className="font-semibold text-lg">{data.novel.title}</h1>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {data.act.title} - {data.chapter.title}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <button
                                onClick={toggleFontSize}
                                className="px-3 py-1 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                title={`Font size: ${fontSize}px`}
                            >
                                A{fontSize === 20 ? '+' : fontSize === 18 ? '' : '-'}
                            </button>
                            <button
                                onClick={toggleTheme}
                                className="px-3 py-1 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
                            >
                                {theme === 'light' ? '🌙' : '☀️'}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex">
                {/* Table of Contents Sidebar */}
                {showTOC && (
                    <aside className={`fixed left-0 top-16 w-80 h-full overflow-y-auto border-r transition-colors z-40 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                        }`}>
                        <div className="p-4">
                            <h3 className="font-semibold mb-4 flex items-center">
                                <Book size={18} className="mr-2" />
                                Mục lục
                            </h3>

                            {data.acts.map((act: ActWithChapters) => (
                                <div key={act._id} className="mb-4">
                                    <div className={`font-medium py-2 px-3 rounded-lg mb-2 ${act._id === data.act._id
                                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                                        : 'bg-gray-50 dark:bg-gray-700'
                                        }`}>
                                        {act.actType ?? 'Act'} {act.actNumber}: {act.title}
                                    </div>

                                    {/* Hiển thị chapters của act này */}
                                    <div className="ml-4 space-y-1">
                                        {act.chapters.map((chapter) => (
                                            <button
                                                key={chapter._id}
                                                onClick={() => {
                                                    router.push(`/chapter/${chapter._id}`);
                                                    setShowTOC(false); // Đóng TOC khi chọn chapter
                                                }}
                                                className={`block w-full text-left py-2 px-3 rounded-md text-sm transition-colors ${chapter._id === data.chapter._id
                                                    ? 'bg-blue-500 text-white'
                                                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                                    }`}
                                            >
                                                Chương {chapter.chapterNumber}: {chapter.title}
                                            </button>
                                        ))}

                                        {/* Hiển thị thông báo nếu act chưa có chapter nào */}
                                        {act.chapters.length === 0 && (
                                            <div className="text-sm text-gray-500 dark:text-gray-400 italic py-2 px-3">
                                                Chưa có chương nào
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </aside>
                )}

                {/* Main Content */}
                <main className={`flex-1 ${showTOC ? 'ml-80' : ''} transition-all`}>
                    <div className="max-w-4xl mx-auto px-4 py-8">
                        {/* Chapter Header */}
                        <div className="mb-8 text-center">
                            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                                _Chương {data.chapter.chapterNumber}_
                            </div>
                            <h1 className="text-3xl font-bold mb-4">{data.chapter.title}</h1>
                            <div className="flex items-center justify-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                                {data.chapter.wordCount && (
                                    <div className="flex items-center">
                                        <Clock size={16} className="mr-1" />
                                        {data.chapter.wordCount.toLocaleString()} từ
                                    </div>
                                )}
                                <div>
                                    Cập nhật: {new Date(data.chapter.updatedAt).toLocaleDateString('vi-VN')}
                                </div>
                            </div>
                        </div>

                        {/* Chapter Content */}
                        <div
                            className={`prose prose-lg max-w-none leading-relaxed transition-all ${theme === 'dark' ? 'prose-invert' : ''
                                }`}
                            style={{ fontSize: `${fontSize}px` }}
                            dangerouslySetInnerHTML={{ __html: data.chapter.content }}
                        />

                        {/* Navigation */}
                        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-center">
                                <button
                                    onClick={goToPrevChapter}
                                    disabled={!data.navigation.hasPrev}
                                    className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all ${data.navigation.hasPrev
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                                        }`}
                                >
                                    <ChevronLeft size={20} className="mr-2" />
                                    Chương trước
                                </button>

                                <div className="text-center">
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        Chương {data.chapter.chapterNumber} / {data.chaptersInAct.length}
                                    </div>
                                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                        Phím ← → để chuyển trang
                                    </div>
                                </div>

                                <button
                                    onClick={goToNextChapter}
                                    disabled={!data.navigation.hasNext}
                                    className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all ${data.navigation.hasNext
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                                        }`}
                                >
                                    Chương sau
                                    <ChevronRight size={20} className="ml-2" />
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ChapterPage;