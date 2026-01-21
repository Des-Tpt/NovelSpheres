import React, { useState, useEffect } from 'react';
import { X, FileText, Loader2, Hash } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createChapter } from '@/action/chapterActions';
import { notifyError, notifySuccess } from '@/utils/notify';
import { motion, AnimatePresence } from 'framer-motion';
import TiptapEditor from '@/components/ui/TiptapEditor';
import getWordCountFromHtml from '@/utils/getWordCountFromHtml';

interface CreateChapterPopupProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    novelId: string;
    actId: string;
}

const CreateChapterPopup: React.FC<CreateChapterPopupProps> = ({ isOpen, onClose, userId, novelId, actId }) => {
    const [title, setTitle] = useState<string>('');
    const [content, setContent] = useState<string>('');
    const [chapterNumber, setChapterNumber] = useState<number>(1);
    const [chapterNumberStr, setChapterNumberStr] = useState<string>("1");
    const queryClient = useQueryClient();
    const [wordCount, setWordCount] = useState<number>(0);
    const mouseDownTargetRef = React.useRef<EventTarget | null>(null);

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

    // Calculate word count from content
    useEffect(() => {
        setWordCount(getWordCountFromHtml(content))
    }, [content])

    const createChapterMutation = useMutation({
        mutationFn: createChapter,
        onSuccess: (response) => {
            const newChapter = response.data;

            // Update novelDetail cache, get data from api response and add to cache
            queryClient.setQueryData(['novelDetail', novelId], (oldData: any) => {
                if (!oldData?.acts) return oldData;

                return {
                    ...oldData,
                    acts: oldData.acts.map((act: any) =>
                        act._id === newChapter.actId ? {
                            ...act,
                            chapters: [
                                ...(act.chapters || []),
                                newChapter
                            ].sort((a, b) => a.chapterNumber - b.chapterNumber)
                        }
                            : act
                    )
                };
            });

            notifySuccess('Tạo chapter thành công!');
            setTimeout(() => {
                onClose();
            }, 100);
        },
        onError: (error: Error) => {
            console.error('Error creating chapter:', error);
            notifyError(error?.message || 'Tạo chapter thất bại!');
        }
    });

    const handleSubmit = async () => {
        if (!title.trim()) {
            notifyError('Vui lòng nhập tên Chapter');
            return;
        }

        if (!content.trim()) {
            notifyError('Vui lòng nhập nội dung Chapter');
            return;
        }

        const chapterData = {
            userId,
            novelId,
            actId,
            title: title.toString(),
            content: content.toString(),
            chapterNumber,
            wordCount
        };

        try {
            await createChapterMutation.mutateAsync(chapterData);
        } catch (error) {
            console.error('Error creating chapter:', error);
        }
    };

    const handleClose = () => {
        if (createChapterMutation.isPending) return;

        setTitle('');
        setContent('');
        setChapterNumber(1);

        onClose();
    };


    // Handle backdrop click - only close if mousedown and mouseup both on backdrop
    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        mouseDownTargetRef.current = e.target;
    };

    const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
        if (
            e.target === e.currentTarget &&
            mouseDownTargetRef.current === e.currentTarget &&
            !createChapterMutation.isPending
        ) {
            handleClose();
        }
        mouseDownTargetRef.current = null;
    };

    // Handle ESC key
    useEffect(() => {
        const handleEscKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !createChapterMutation.isPending) {
                handleClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscKey);
        }

        return () => {
            document.removeEventListener('keydown', handleEscKey);
        };
    }, [isOpen, createChapterMutation.isPending]);

    return (
        <>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 bg-black/60 flex items-center justify-center z-70 p-4"
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
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
                        className="bg-gray-900 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] border border-gray-700 relative overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Loading Overlay */}
                        <AnimatePresence>
                            {createChapterMutation.isPending && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-gray-900/80 rounded-lg flex items-center justify-center z-10"
                                >
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                                        <p className="text-sm text-gray-300">Đang tạo Chapter...</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Scrollable Content */}
                        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6 sticky top-0 bg-gray-900 pb-2 z-10">
                                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <FileText size={20} className="text-orange-500" />
                                    Tạo Chapter Mới
                                </h2>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={handleClose}
                                    className="hover:text-yellow-300 transition-colors text-gray-400 cursor-pointer disabled:opacity-50"
                                    disabled={createChapterMutation.isPending}
                                >
                                    <X size={20} />
                                </motion.button>
                            </div>

                            <div className="space-y-4 pb-4">
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
                                        placeholder="Ví dụ: Khởi đầu cuộc hành trình..."
                                        className="w-full px-3 py-2 bg-black border-2 border-blue-500 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors disabled:opacity-50"
                                        disabled={createChapterMutation.isPending}
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
                                            value={chapterNumberStr}
                                            onChange={(e) => {
                                                setChapterNumberStr(e.target.value);
                                            }}
                                            onBlur={() => {
                                                FileText
                                                const num = parseInt(chapterNumberStr, 10);
                                                if (isNaN(num)) {
                                                    setChapterNumberStr("1");
                                                    setChapterNumber(1);
                                                } else {
                                                    setChapterNumberStr(String(num));
                                                    setChapterNumber(num);
                                                }
                                            }}
                                            className="w-full pl-10 pr-3 py-2 bg-black border-2 border-blue-500 rounded text-white focus:outline-none focus:border-blue-400 transition-colors disabled:opacity-50"
                                            disabled={createChapterMutation.isPending}
                                        />
                                    </div>
                                </motion.div>

                                {/* Content */}
                                <motion.div
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <label className="block text-sm font-medium mb-2 text-gray-300">
                                        Nội dung Chapter *
                                    </label>

                                    <TiptapEditor
                                        content={content}
                                        onChange={setContent}
                                        placeholder="Viết nội dung chapter..."
                                        minHeight="300px"
                                    />

                                    {/* Word Count Display */}
                                    <div className="flex justify-between items-center mt-2 text-sm text-gray-400">
                                        <span>Số từ: {wordCount.toLocaleString()}</span>
                                        <span className={`${content.length > 5000 ? 'text-orange-400' : content.length > 10000 ? 'text-red-400' : 'text-gray-400'}`}>
                                            {content.length.toLocaleString()} ký tự
                                        </span>
                                    </div>
                                </motion.div>

                                {/* Info Card */}
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                    className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-3"
                                >
                                    <h4 className="text-sm font-medium text-blue-300 mb-2">📝 Thông tin Chapter</h4>
                                    <div className="text-sm text-gray-400 space-y-1">
                                        <p>• Số từ sẽ được tính tự động từ nội dung</p>
                                        <p>• Thời gian tạo và cập nhật sẽ được lưu tự động</p>
                                    </div>
                                </motion.div>
                            </div>
                        </div>

                        {/* Action Buttons - Fixed at bottom */}
                        <motion.div
                            className="flex gap-3 pt-4 border-t border-gray-700 bg-gray-900"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            <motion.button
                                whileHover={{ scale: createChapterMutation.isPending ? 1 : 1.02 }}
                                whileTap={{ scale: createChapterMutation.isPending ? 1 : 0.98 }}
                                onClick={handleClose}
                                className="flex-1 px-4 py-2 border border-gray-600 cursor-pointer text-white rounded hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={createChapterMutation.isPending}
                            >
                                Hủy
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: createChapterMutation.isPending ? 1 : 1.02 }}
                                whileTap={{ scale: createChapterMutation.isPending ? 1 : 0.98 }}
                                onClick={handleSubmit}
                                className="flex-1 px-4 py-2 bg-orange-600 cursor-pointer text-white rounded hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                disabled={createChapterMutation.isPending}
                            >
                                {createChapterMutation.isPending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Đang tạo...
                                    </>
                                ) : (
                                    <>
                                        <FileText size={16} />
                                        Tạo Chapter
                                    </>
                                )}
                            </motion.button>
                        </motion.div>
                    </motion.div>
                </motion.div>
            )}
        </>
    );
};

export default CreateChapterPopup;