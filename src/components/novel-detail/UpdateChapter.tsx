import React, { useState, useEffect } from 'react';
import { X, FileText, Loader2, Hash, Edit3, AlertCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateChapter } from '@/action/novelActions';
import { notifyError, notifySuccess } from '@/utils/notify';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from "next/dynamic";
import getWordCountFromHtml from '@/utils/getWordCountFromHtml';

const JoditEditor = dynamic(() => import("jodit-react"), {
    ssr: false,
});

interface Chapter {
    _id: string;
    actId: string;
    title: string;
    chapterNumber: number;
    wordCount: number;
}

interface EditChapterPopupProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    novelId: string;
    chapter: Chapter | null;
}

const config = {
    height: 250,
    readonly: false,
    placeholder: 'Paste nội dung mới vào đây để chỉnh sửa chapter (tùy chọn)...',
    events: {
        beforePaste: (html: string) => {
            // Xoá thuộc tính màu chữ và nền
            return html.replace(/color\s*:\s*[^;"]+;?/gi, '')
                .replace(/background(-color)?\s*:\s*[^;"]+;?/gi, '');
        }
    }
};

const EditChapterPopup: React.FC<EditChapterPopupProps> = ({ isOpen, onClose, userId, novelId, chapter }) => {
    const [title, setTitle] = useState<string>('');
    const [content, setContent] = useState<string>('');
    const [chapterNumber, setChapterNumber] = useState<number>(1);
    const [hasContentChanged, setHasContentChanged] = useState<boolean>(false);
    const queryClient = useQueryClient();
    const [wordCount, setWordCount] = useState<number>(0);

    // Lock body scroll when popup is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            document.body.style.paddingRight = '0px';
        } else {
            document.body.style.overflow = 'unset';
            document.body.style.paddingRight = '0px';
        }

        return () => {
            document.body.style.overflow = 'unset';
            document.body.style.paddingRight = '0px';
        };
    }, [isOpen]);

    // Load chapter data when popup opens (không load content)
    useEffect(() => {
        if (isOpen && chapter) {
            setTitle(chapter.title || '');
            setChapterNumber(chapter.chapterNumber || 1);
            // Không load content, chỉ reset state
            setContent('');
            setHasContentChanged(false);
            setWordCount(0);
        }
    }, [isOpen, chapter]);

    // Calculate word count from content (chỉ khi có content mới)
    useEffect(() => {
        if (content.trim()) {
            setWordCount(getWordCountFromHtml(content));
            setHasContentChanged(true);
        } else {
            setWordCount(0);
            setHasContentChanged(false);
        }
    }, [content]);

    const updateChapterMutation = useMutation({
        mutationFn: updateChapter,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['novelDetail', novelId] });
            queryClient.invalidateQueries({ queryKey: ['chapter', chapter?._id] });
            notifySuccess('Cập nhật chapter thành công!');
            setTimeout(() => {
                onClose();
            }, 100);
        },
        onError: (error: any) => {
            console.error('Error updating chapter:', error);
            notifyError(error?.message || 'Cập nhật chapter thất bại!');
        }
    });

    const handleSubmit = async () => {
        if (!chapter) {
            notifyError('Không tìm thấy thông tin chapter');
            return;
        }

        if (!title.trim()) {
            notifyError('Vui lòng nhập tên Chapter');
            return;
        }

        const chapterData = {
            chapterId: chapter._id,
            userId,
            novelId,
            actId: chapter.actId,
            title: title.toString(),
            // Chỉ gửi content nếu có thay đổi, để undefined nếu không
            content: hasContentChanged ? content.toString() : undefined,
            chapterNumber,
            wordCount: hasContentChanged ? wordCount : undefined
        };

        try {
            await updateChapterMutation.mutateAsync(chapterData);
        } catch (error) {
            console.error('Error updating chapter:', error);
        }
    };

    const handleClose = () => {
        if (updateChapterMutation.isPending) return;

        // Reset form
        setTitle('');
        setContent('');
        setChapterNumber(1);
        setHasContentChanged(false);

        onClose();
    };

    // Handle backdrop click
    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget && !updateChapterMutation.isPending) {
            handleClose();
        }
    };

    // Handle ESC key
    useEffect(() => {
        const handleEscKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !updateChapterMutation.isPending) {
                handleClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscKey);
        }

        return () => {
            document.removeEventListener('keydown', handleEscKey);
        };
    }, [isOpen, updateChapterMutation.isPending]);

    // Check if there are unsaved changes
    const hasUnsavedChanges = chapter && (
        title !== (chapter.title || '') ||
        chapterNumber !== (chapter.chapterNumber || 1) ||
        hasContentChanged
    );

    return (
        <>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
                    onClick={handleBackdropClick}
                    style={{
                        backdropFilter: 'blur(2px)',
                        WebkitBackdropFilter: 'blur(2px)'
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 25,
                            duration: 0.3
                        }}
                        className="bg-gray-900 rounded-lg w-full max-w-2xl max-h-[90vh] border border-gray-700 relative flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Loading Overlay */}
                        <AnimatePresence>
                            {updateChapterMutation.isPending && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-gray-900/80 rounded-lg flex items-center justify-center z-70"
                                >
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                                        <p className="text-sm text-gray-300">Đang cập nhật Chapter...</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Fixed Header */}
                        <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-700">
                            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Edit3 size={20} className="text-blue-500" />
                                Chỉnh sửa Chapter
                                {hasUnsavedChanges && (
                                    <span className="text-xs bg-yellow-600 text-yellow-100 px-2 py-1 rounded-full">
                                        Có thay đổi
                                    </span>
                                )}
                            </h2>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={handleClose}
                                className="hover:text-yellow-300 transition-colors text-gray-400 cursor-pointer disabled:opacity-50"
                                disabled={updateChapterMutation.isPending}
                            >
                                <X size={20} />
                            </motion.button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto px-6 py-4">
                            <div className="space-y-4">
                                {/* Chapter Title */}
                                <motion.div
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    <label className="block text-sm font-medium mb-2 text-gray-300">
                                        Tên Chapter *
                                    </label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Ví dụ: Chapter 1: Khởi đầu cuộc hành trình..."
                                        className="w-full px-3 py-2 bg-black border-2 border-blue-500 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors disabled:opacity-50"
                                        disabled={updateChapterMutation.isPending}
                                    />
                                </motion.div>

                                {/* Chapter Number */}
                                <motion.div
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <label className="block text-sm font-medium mb-2 text-gray-300">
                                        Số thứ tự Chapter *
                                    </label>
                                    <div className="relative">
                                        <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            type="number"
                                            value={chapterNumber}
                                            onChange={(e) => {
                                                const value = parseInt(e.target.value);
                                                setChapterNumber(isNaN(value) ? 1 : value);
                                            }}
                                            className="w-full pl-10 pr-3 py-2 bg-black border-2 border-blue-500 rounded text-white focus:outline-none focus:border-blue-400 transition-colors disabled:opacity-50"
                                            disabled={updateChapterMutation.isPending}
                                        />
                                    </div>
                                </motion.div>

                                {/* Performance Info - Compact */}
                                <motion.div
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.25 }}
                                    className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-3"
                                >
                                    <div className="flex items-start gap-2">
                                        <AlertCircle size={16} className="text-blue-300 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h4 className="text-sm font-medium text-blue-300 mb-1">💡 Tối ưu hiệu suất</h4>
                                            <p className="text-xs text-gray-400 leading-relaxed">
                                                Nội dung cũ không được load để tránh lag. Paste nội dung mới bên dưới để cập nhật (tùy chọn).
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Content */}
                                <motion.div
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <label className="block text-sm font-medium mb-2 text-gray-300">
                                        Nội dung Chapter (Tùy chọn)
                                        {hasContentChanged && (
                                            <span className="text-green-400 ml-2 text-xs">
                                                ✓ Có nội dung mới
                                            </span>
                                        )}
                                    </label>

                                    <JoditEditor
                                        value={content}
                                        config={config}
                                        onBlur={(newContent) => setContent(newContent)}
                                    />

                                    {/* Word Count Display */}
                                    <div className="flex justify-between items-center mt-2 text-sm text-gray-400">
                                        {hasContentChanged ? (
                                            <>
                                                <span className="text-green-400">Số từ mới: {wordCount.toLocaleString()}</span>
                                                <span className={`${content.length > 5000 ? 'text-orange-400' : content.length > 10000 ? 'text-red-400' : 'text-green-400'}`}>
                                                    {content.length.toLocaleString()} ký tự
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Chỉ cập nhật metadata</span>
                                                <span className="text-gray-500">Nội dung không thay đổi</span>
                                            </>
                                        )}
                                    </div>
                                </motion.div>

                                {/* Info Card */}
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                    className="bg-green-900/20 border border-green-700/30 rounded-lg p-3"
                                >
                                    <h4 className="text-sm font-medium text-green-300 mb-2">✏️ Cách sử dụng</h4>
                                    <div className="text-sm text-gray-400 space-y-1">
                                        <p>• Có thể chỉ sửa tên và số thứ tự Chapter</p>
                                        <p>• Paste nội dung mới nếu muốn thay đổi nội dung</p>
                                        <p>• Nếu không paste nội dung, chỉ metadata được cập nhật</p>
                                        {hasContentChanged && (
                                            <p className="text-green-400">• ✓ Sẽ cập nhật cả nội dung và metadata</p>
                                        )}
                                    </div>
                                </motion.div>
                            </div>
                        </div>

                        {/* Fixed Footer */}
                        <div className="p-6 pt-4 border-t border-gray-700">
                            <motion.div
                                className="flex gap-3"
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.5 }}
                            >
                                <motion.button
                                    whileHover={{ scale: updateChapterMutation.isPending ? 1 : 1.02 }}
                                    whileTap={{ scale: updateChapterMutation.isPending ? 1 : 0.98 }}
                                    onClick={handleClose}
                                    className="flex-1 px-4 py-2 border border-gray-600 cursor-pointer text-white rounded hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={updateChapterMutation.isPending}
                                >
                                    {hasUnsavedChanges ? 'Hủy thay đổi' : 'Đóng'}
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: updateChapterMutation.isPending ? 1 : 1.02 }}
                                    whileTap={{ scale: updateChapterMutation.isPending ? 1 : 0.98 }}
                                    onClick={handleSubmit}
                                    className={`flex-1 px-4 py-2 cursor-pointer text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                                        hasUnsavedChanges
                                            ? hasContentChanged
                                                ? 'bg-blue-600 hover:bg-blue-700'
                                                : 'bg-green-600 hover:bg-green-700'
                                            : 'bg-gray-600'
                                    }`}
                                    disabled={updateChapterMutation.isPending || !hasUnsavedChanges}
                                >
                                    {updateChapterMutation.isPending ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Đang lưu...
                                        </>
                                    ) : hasContentChanged ? (
                                        <>
                                            <Edit3 size={16} />
                                            Cập nhật toàn bộ
                                        </>
                                    ) : hasUnsavedChanges ? (
                                        <>
                                            <Edit3 size={16} />
                                            Cập nhật metadata
                                        </>
                                    ) : (
                                        <>
                                            <Edit3 size={16} />
                                            Cập nhật Chapter
                                        </>
                                    )}
                                </motion.button>
                            </motion.div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </>
    );
};

export default EditChapterPopup;