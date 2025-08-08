'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Eye, Search, Loader2, ChevronDown } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPost } from '@/action/postActions';
import { notifyError, notifySuccess } from '@/utils/notify';
import dynamic from "next/dynamic";
import { debounce } from 'lodash';
import { getNovelForNewPost } from '@/action/novelActions';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrollLock } from '@/hooks/useScrollLock';
import handleStatus from '@/utils/handleStatus';

const JoditEditor = dynamic(() => import("jodit-react"), {
    ssr: false,
});

interface NewPostPopupProps {
    isOpen: boolean;
    onClose: () => void;
    novels?: { _id: string; title: string }[];
}

type CategoryType = "general" | "reviews" | "recommendations" | "ask-author" | "writing" | "support";

const CATEGORIES: { value: CategoryType; label: string }[] = [
    { value: "general", label: "Thảo luận chung" },
    { value: "reviews", label: "Đánh giá" },
    { value: "recommendations", label: "Gợi ý" },
    { value: "ask-author", label: "Hỏi tác giả" },
    { value: "writing", label: "Viết lách" },
    { value: "support", label: "Hỗ trợ" },
];

const config = {
    height: 250,
    style: {
        background: '#111827',
        color: '#f9fafb',
    },
    editorCssClass: 'jodit-dark-editor'
}

interface Novel {
    _id: string;
    title: string;
    rating: number;
    status: string;
}

export default function NewPostPopup({ isOpen, onClose, novels = [] }: NewPostPopupProps) {
    const [formData, setFormData] = useState({
        title: '',
        category: 'general' as CategoryType,
        content: '',
        novelId: ''
    });
    const queryClient = useQueryClient();
    const [isPreview, setIsPreview] = useState(false);
    const [isSearching, setIsSearching] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [result, setResults] = useState<Novel[]>([]);
    const [showNoResult, setShowNoResult] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [selectedNovel, setSelectedNovel] = useState<Novel | null>(null);
    const dragFromInside = useRef(false);


    // Lock scroll when open Popup
    useScrollLock(isOpen);

    const mutation = useMutation({
        mutationFn: createPost,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['forum-posts'] });
            notifySuccess('Đăng bài thành công!');
            handleClose();
        },
        onError: (error: Error) => {
            notifyError('Đã có lỗi khi đăng bài!');
            console.error(error);
        }
    });

    const handleClose = () => {
        setFormData({ title: '', category: 'general', content: '', novelId: '' });
        setIsPreview(false);
        setSearchQuery('');
        setResults([]);
        setShowDropdown(false);
        setShowCategoryDropdown(false);
        setSelectedNovel(null);
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim() || !formData.content.trim()) return;

        await mutation.mutateAsync({
            novelId: formData.novelId || undefined,
            title: formData.title.trim(),
            category: formData.category,
            content: formData.content,
        });
    };

    const updateFormData = (field: keyof typeof formData) => (value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const fetchResult = async (text: string) => {
        setIsSearching(true);
        try {
            const dataRes = await getNovelForNewPost(text);
            setResults(dataRes || []);
        } catch (error) {
            console.error('Lỗi:', error);
            setResults([]);
        } finally {
            setIsSearching(false);
        }
    }

    const debouncedSearching = debounce((value: string) => {
        if (value.trim() && !selectedNovel) {
            fetchResult(value);
            setShowDropdown(true);
        } else if (!selectedNovel) {
            setResults([]);
            setShowDropdown(false);
        }
    }, 500);

    const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchQuery(value);

        if (!selectedNovel) {
            setShowDropdown(true);
        }
    };

    const handleSelectNovel = (novel: Novel) => {
        setSelectedNovel(novel);
        setFormData(prev => ({ ...prev, novelId: novel._id }));
        setSearchQuery(novel.title);
        setShowDropdown(false);
    };

    const handleClearSelection = () => {
        setSelectedNovel(null);
        setFormData(prev => ({ ...prev, novelId: '' }));
        setSearchQuery('');
        setResults([]);
        setShowDropdown(false);
        setShowNoResult(false);
    };

    const handleSelectCategory = (category: CategoryType) => {
        updateFormData('category')(category);
        setShowCategoryDropdown(false);
    };

    useEffect(() => {
        debouncedSearching(searchQuery);
        return debouncedSearching.cancel
    }, [searchQuery])

    useEffect(() => {
        if (!isSearching && searchQuery.trim() !== '' && result?.length === 0) {
            const timer = setTimeout(() => {
                setShowNoResult(true);
            }, 500);
            return () => clearTimeout(timer);
        } else {
            setShowNoResult(false);
        }
    }, [searchQuery, isSearching, result]);

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        dragFromInside.current = e.target !== e.currentTarget;
    };

    const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget && !dragFromInside.current) {
            handleClose();
        }
        dragFromInside.current = false;
    };

    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        dragFromInside.current = e.target !== e.currentTarget;
    };

    const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget && !dragFromInside.current) {
            handleClose();
        }
        dragFromInside.current = false;
    };
    if (!isOpen) return null;

    return (
        <>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-3 sm:p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                >
                    <motion.div
                        className="bg-gray-950 rounded-lg shadow-xl w-full max-w-md sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col border border-gray-800"
                        initial={{ scale: 0.9, opacity: 0, y: 50 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 50 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        onClick={(e) => e.stopPropagation()}
                    >

                        {/* Header - Fixed */}
                        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-800 bg-gray-900 flex-shrink-0">
                            <h2 className="text-lg sm:text-xl font-semibold text-gray-100">Tạo bài viết mới</h2>
                            <button
                                onClick={handleClose}
                                className="p-1 hover:bg-gray-800 rounded transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                            {/* Scrollable Content */}
                            <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 overflow-y-auto flex-1 scrollbar-hide">

                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-200 mb-1">
                                        Tiêu đề <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => updateFormData('title')(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-900 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-gray-600 focus:border-gray-600 text-sm"
                                        placeholder="Nhập tiêu đề bài viết..."
                                        required
                                    />
                                </div>

                                {/* Category & Novel Search */}
                                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                                    <div className="relative">
                                        <label className="block text-sm font-medium text-gray-200 mb-1">
                                            Danh mục <span className="text-red-400">*</span>
                                        </label>
                                        <div
                                            className="w-full pr-[9px] pl-3 py-2 border border-gray-700 rounded-md bg-gray-900 text-gray-100 focus:ring-2 focus:ring-gray-600 focus:border-gray-600 text-sm cursor-pointer flex justify-between items-center"
                                            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                                        >
                                            <span>{CATEGORIES.find(cat => cat.value === formData.category)?.label || 'Chọn danh mục'}</span>
                                            <ChevronDown className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <AnimatePresence>
                                            {showCategoryDropdown && (
                                                <motion.div
                                                    className="absolute z-50 w-full mt-1 bg-gray-900 border border-gray-700 rounded-md shadow-lg max-h-48 overflow-y-auto scrollbar-hide"
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    transition={{ duration: 0.15 }}
                                                >
                                                    {CATEGORIES.map((cat) => (
                                                        <motion.button
                                                            key={cat.value}
                                                            type="button"
                                                            onClick={() => handleSelectCategory(cat.value)}
                                                            className="w-full text-left px-3 py-2 hover:bg-gray-800 focus:bg-gray-800 focus:outline-none border-b border-gray-700 last:border-b-0 transition-colors"
                                                            whileHover={{ backgroundColor: 'rgba(31, 41, 55, 1)' }}
                                                        >
                                                            <div className="text-sm text-gray-100 font-medium">
                                                                {cat.label}
                                                            </div>
                                                        </motion.button>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Novel Search Input */}
                                    <div className="relative">
                                        <label className="block text-sm font-medium text-gray-200 mb-1">
                                            Tìm kiếm Novel
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                {isSearching ? (
                                                    <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
                                                ) : (
                                                    <Search className="h-4 w-4 text-gray-400" />
                                                )}
                                            </div>
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={handleSearchInputChange}
                                                onFocus={() => {
                                                    if (!selectedNovel && result.length > 0) {
                                                        setShowDropdown(true);
                                                    }
                                                }}
                                                onBlur={() => {
                                                    setTimeout(() => setShowDropdown(false), 150);
                                                }}
                                                className="w-full pl-10 pr-10 py-2 border border-gray-700 rounded-md bg-gray-900 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-gray-600 focus:border-gray-600 text-sm"
                                                placeholder="Tìm kiếm novel..."
                                            />
                                            {selectedNovel && (
                                                <button
                                                    type="button"
                                                    onClick={handleClearSelection}
                                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                                >
                                                    <X className="h-4 w-4 text-gray-400 hover:text-gray-200" />
                                                </button>
                                            )}
                                        </div>

                                        {/* Search Dropdown */}
                                        <AnimatePresence>
                                            {showDropdown && !selectedNovel && (
                                                <motion.div
                                                    className="absolute z-50 w-full mt-1 bg-gray-900 border border-gray-700 rounded-md shadow-lg max-h-48 sm:max-h-60 overflow-y-auto scrollbar-hide"
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    transition={{ duration: 0.15 }}
                                                >
                                                    {isSearching && (
                                                        <div className="flex items-center justify-center py-3">
                                                            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                                            <span className="ml-2 text-sm text-gray-400">Đang tìm kiếm...</span>
                                                        </div>
                                                    )}

                                                    {!isSearching && result.length > 0 && (
                                                        <>
                                                            {result.map((novel) => (
                                                                <motion.button
                                                                    key={novel._id}
                                                                    type="button"
                                                                    onClick={() => handleSelectNovel(novel)}
                                                                    className="w-full text-left px-3 py-2 hover:bg-gray-800 focus:bg-gray-800 focus:outline-none border-b border-gray-700 last:border-b-0 transition-colors"
                                                                    whileHover={{ backgroundColor: 'rgba(31, 41, 55, 1)' }}
                                                                >
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="min-w-0 flex-1">
                                                                            <div className="text-sm text-gray-100 font-medium truncate">
                                                                                {novel.title}
                                                                            </div>
                                                                            <div className="text-xs text-gray-400">
                                                                                ⭐ {novel.rating} • {handleStatus(novel.status)}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </motion.button>
                                                            ))}
                                                        </>
                                                    )}

                                                    {!isSearching && showNoResult && searchQuery.trim() !== '' && (
                                                        <div className="px-3 py-2 text-sm text-gray-400 text-center">
                                                            Không tìm thấy novel nào
                                                        </div>
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                {/* Selected Novel Display */}
                                <AnimatePresence>
                                    {selectedNovel && (
                                        <motion.div
                                            className="bg-gray-800 rounded-md py-3 px-[12px] border border-gray-700"
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-lg text-gray-200 font-medium truncate">
                                                        Novel đã chọn: {selectedNovel.title}
                                                    </div>
                                                    <div className="text-xs text-gray-400 font-inter">
                                                        ⭐ {selectedNovel.rating} • {handleStatus(selectedNovel.status)}
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={handleClearSelection}
                                                    className="text-gray-400 hover:text-gray-200 transition-colors"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Fallback to existing novels dropdown if no search results */}
                                {novels.length > 0 && !selectedNovel && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-200 mb-1">
                                            Hoặc chọn từ danh sách có sẵn
                                        </label>
                                        <select
                                            value={formData.novelId}
                                            onChange={(e) => updateFormData('novelId')(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-900 text-gray-100 focus:ring-2 focus:ring-gray-600 focus:border-gray-600 text-sm"
                                        >
                                            <option value="" className="bg-gray-900">-- Chọn novel --</option>
                                            {novels.map((novel) => (
                                                <option key={novel._id} value={novel._id} className="bg-gray-900">
                                                    {novel.title}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Content Editor */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-sm font-medium text-gray-200">
                                            Nội dung <span className="text-red-400">*</span>
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setIsPreview(!isPreview)}
                                            className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition-colors"
                                        >
                                            <Eye className="w-3 h-3" />
                                            {isPreview ? 'Sửa' : 'Xem'}
                                        </button>
                                    </div>

                                    {!isPreview ? (
                                        <JoditEditor
                                            value={formData.content}
                                            config={config}
                                            onChange={(newContent) => updateFormData('content')(newContent)}
                                        />
                                    ) : (
                                        <div className="min-h-[200px] sm:min-h-[250px] p-3 border border-gray-700 rounded-md bg-gray-900">
                                            <div
                                                className="prose prose-sm max-w-none prose-invert"
                                                dangerouslySetInnerHTML={{
                                                    __html: formData.content || '<p class="text-gray-500">Chưa có nội dung...</p>'
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer - Fixed */}
                            <div className="flex flex-col sm:flex-row justify-end gap-2 p-3 sm:p-4 border-t border-gray-800 bg-gray-950 flex-shrink-0">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="w-full sm:w-auto px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium order-2 sm:order-1"
                                    disabled={mutation.isPending}
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={!formData.title.trim() || !formData.content.trim() || mutation.isPending}
                                    className="w-full sm:w-auto px-4 py-2 bg-gray-800 hover:bg-gray-900 disabled:bg-gray-400 text-white text-sm font-medium rounded-md transition-colors order-1 sm:order-2"
                                >
                                    {mutation.isPending ? 'Đang đăng...' : 'Đăng bài'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </>
    );
}