'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Book, Clock, Menu, X, HomeIcon, Settings } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getChapterById } from '@/action/chapterActions';
import { useSettingChapterStore } from '@/store/settingChapterStore';
import ChapterSettingPopup from './SettingChapterPopup';
import { getUserFromCookies } from '@/action/userAction';


interface Novel {
    _id: string;
    title: string;
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

interface CurrentUser {
    _id: string;
    username: string;
    email: string;
    publicId: string;
    format: string;
    role: string;
}


const ChapterPage = () => {
    const router = useRouter();
    const params = useParams();
    const chapterId = params.chapterId as string;
    const queryClient = useQueryClient();

    const [showTOC, setShowTOC] = useState<boolean>(false);
    const [showSetting, setShowSetting] = useState(false);
    const { fontSize, fontFamily, lineSpacing, nightMode } = useSettingChapterStore();
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
    const [initComplete, setInitComplete] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const fetchCurrentUser = async () => {
            try {
                const response = await getUserFromCookies();
                if (isMounted) {
                    setCurrentUser(response?.user || null);
                }
            } catch (error) {
                if (isMounted) {
                    setCurrentUser(null);
                }
            } finally {
                if (isMounted) {
                    setInitComplete(true);
                }
            }
        };

        fetchCurrentUser();
        return () => {
            isMounted = false;
        };
    }, []);

    console.log(currentUser?._id);

    const { data, isLoading, error, refetch } = useQuery<ChapterData>({
        queryKey: ['chapter', chapterId, currentUser?._id || 'guest'],
        queryFn: () => {
            const userId = currentUser?._id;
            return getChapterById(chapterId, userId);
        },
        enabled: !!chapterId && !!initComplete,
        staleTime: 5 * 60 * 1000,
        retry: 2,
    });

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

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'ArrowLeft' && data?.navigation?.hasPrev) {
            goToPrevChapter();
        } else if (event.key === 'ArrowRight' && data?.navigation?.hasNext) {
            goToNextChapter();
        }
    };

    function cleanHtml(html: string) {
        return html
            .replace(/color\s*:\s*[^;"]+;?/gi, '')               // Xóa màu chữ
            .replace(/background-color\s*:\s*[^;"]+;?/gi, '')    // Xóa màu nền
            .replace(/font-size\s*:\s*[^;"]+;?/gi, '')           // Xóa size
            .replace(/font-family\s*:\s*[^;"]+;?/gi, '')         // Xóa font
            .replace(/line-height\s*:\s*[^;"]+;?/gi, '');        // Xóa line height
    }

    // Loading state
    if (isLoading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${nightMode === 'dark' ? 'bg-gray-950' : 'bg-amber-50'}`}>
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
            <div className={`min-h-screen flex items-center justify-center ${nightMode === 'dark' ? 'bg-gray-950' : 'bg-amber-50'}`}>
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
            <div className={`min-h-screen flex items-center justify-center ${nightMode === 'dark' ? 'bg-gray-950' : 'bg-amber-50'}`}>
                <div className="text-center">
                    <p className="text-gray-600">Không tìm thấy dữ liệu chương</p>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`min-h-screen transition-colors ${nightMode === 'dark' ? 'bg-gray-950 text-white' : 'bg-amber-50 text-gray-900'
                }`}
            onKeyDown={handleKeyDown}
        >
            <title>{data.chapter.title}</title>
            {/* Header */}
            <header className={`sticky top-0 z-40 border-b transition-colors ${nightMode === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                }`}>
                <div className="max-w-4xl mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => setShowTOC(!showTOC)}
                                className={`p-2 rounded-lg hover:bg-gray-100 transition-colors`}
                                aria-label="Toggle table of contents"
                            >
                                {showTOC ? <X size={20} /> : <Menu size={20} />}
                            </button>
                            <div>
                                <h1 className="font-semibold text-lg">{data.novel.title}</h1>
                                <p className="text-sm text-gray-600">
                                    {data.act.title} - {data.chapter.title}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setShowSetting(true)}
                                className={`px-3 py-1 text-sm rounded-md ${nightMode === 'dark' ? 'bg-gray-600' : 'bg-gray-200'}`}
                                title="Cài đặt hiển thị"
                            >
                                <Settings className={`w-5 h-5 ${nightMode === 'dark' ? 'text-white' : 'text-gray-950'}`} />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex">
                {/* Table of Contents Sidebar */}
                {showTOC && (
                    <aside className={`fixed left-0 top-16 w-80 h-full overflow-y-auto border-r transition-colors z-40 ${nightMode === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                        }`}>
                        <div className="p-4">
                            {/* Nút về trang tiểu thuyết */}
                            <button
                                onClick={() => {
                                    router.push(`/novels/${data.novel._id}`);
                                    setShowTOC(false);
                                }}
                                className="w-full mb-4 p-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors flex items-center justify-center"
                            >
                                <HomeIcon size={18} className="mr-2" />
                                Về trang tiểu thuyết
                            </button>

                            <h3 className="font-semibold mb-4 flex items-center">
                                <Book size={18} className="mr-2" />
                                Mục lục
                            </h3>

                            {data.acts.map((act: ActWithChapters) => (
                                <div key={act._id} className="mb-4">
                                    <div className={`font-medium py-2 px-3 rounded-lg mb-2 ${act._id === data.act._id
                                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                                        : ''
                                        }`}>
                                        {act.actType === '' ? 'Act' : act.actType} {act.actNumber}: {act.title}
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
                                                    : 'hover:bg-gray-100 dark:hover:bg-gray-300'
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
                            <div className="text-sm text-gray-500 mb-2">
                                _Chương {data.chapter.chapterNumber}_
                            </div>
                            <h1 className="text-3xl font-bold mb-4">{data.chapter.title}</h1>
                            <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
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
                            className={`prose prose-invert max-w-none leading-relaxed transition-all ${nightMode === 'dark' ? 'bg-gray-950 text-white' : 'bg-amber-50 text-black'}`}
                            style={{
                                fontSize: `${fontSize}px`,
                                fontFamily: fontFamily === 'system-ui' ? 'system-ui, -apple-system, "Segoe UI", Roboto' : fontFamily,
                                lineHeight: lineSpacing,
                            }}
                            dangerouslySetInnerHTML={{ __html: cleanHtml(data.chapter.content) }}
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
                                    <p className='hidden sm:inline'>Chương trước</p>
                                    <p className='inline sm:hidden'>Trước</p>
                                </button>

                                <button
                                    onClick={goToNextChapter}
                                    disabled={!data.navigation.hasNext}
                                    className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all ${data.navigation.hasNext
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                                        }`}
                                >
                                    <p className='hidden sm:inline'>Chương sau</p>
                                    <p className='inline sm:hidden'>Sau</p>
                                    <ChevronRight size={20} className="ml-2" />
                                </button>
                            </div>
                        </div>
                    </div>
                    <ChapterSettingPopup isOpen={showSetting} onClose={() => setShowSetting(false)} />
                </main>
            </div>
        </div>
    );
};

export default ChapterPage;