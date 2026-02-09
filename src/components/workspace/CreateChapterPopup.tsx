'use client';

import { useState, useRef, useEffect } from 'react';
import { createChapter } from '@/action/chapterActions';
import { createDraft } from '@/action/draftAction';
import { notifyError, notifySuccess } from '@/utils/notify';
import { motion, AnimatePresence } from 'framer-motion';
import { getUserFromCookies } from '@/action/userAction';
import { X, Loader2, Plus } from 'lucide-react';

interface CreateChapterPopupProps {
    novelId: string;
    actId: string;
    isOpen: boolean;
    onClose: () => void;
    theme: 'light' | 'dark';
    type: string;
    onUpdate: () => void;
}

const CreateChapterPopup = ({ novelId, actId, isOpen, onClose, theme, type, onUpdate }: CreateChapterPopupProps) => {
    const [title, setTitle] = useState<string>('');
    const [chapterNumber, setChapterNumber] = useState<number>(1);
    const [isPending, setIsPending] = useState<boolean>(false);
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        const fetchUser = async () => {
            let data = await getUserFromCookies();
            setCurrentUser(data);
        }
        fetchUser();
    }, []);

    const handleCreateChapter = async () => {
        setIsPending(true);
        if (!currentUser) {
            notifyError('Vui lòng đăng nhập để tạo chapter!');
            setIsPending(false);
            return;
        }

        try {
            if (type === 'draft') {
                await createDraft(currentUser.user._id.toString(), novelId, actId, title, chapterNumber);
                notifySuccess('Tạo bản nháp thành công!');
            } else {
                const postData = {
                    userId: currentUser.user._id.toString(),
                    novelId: novelId,
                    actId: actId,
                    title: title,
                    chapterNumber: chapterNumber,
                    content: '',
                    wordCount: 0
                }

                await createChapter(postData);
                notifySuccess('Tạo chapter thành công!');
            }
            onUpdate();
            setTimeout(() => {
                onClose();
                setTitle('');
                setChapterNumber(prev => prev + 1);
            }, 100);
        } catch (error: any) {
            notifyError(error?.message || (type === 'draft' ? 'Tạo bản nháp thất bại!' : 'Tạo chapter thất bại!'));
        } finally {
            setIsPending(false);
        }
    }

    const backdropClass = "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm";
    const modalBg = theme === 'light' ? 'bg-white' : 'bg-gray-900';
    const modalBorder = theme === 'light' ? 'border-gray-100' : 'border-gray-800';
    const textPrimary = theme === 'light' ? 'text-gray-900' : 'text-white';
    const textSecondary = theme === 'light' ? 'text-gray-500' : 'text-gray-400';
    const inputBg = theme === 'light' ? 'bg-gray-50' : 'bg-gray-800/50';
    const inputBorder = theme === 'light' ? 'border-gray-200' : 'border-gray-700';
    const closeBtnHover = theme === 'light' ? 'hover:bg-gray-100 text-gray-400 hover:text-gray-600' : 'hover:bg-gray-800 text-gray-500 hover:text-gray-300';
    const cancelBtn = theme === 'light' ? 'text-gray-600 hover:bg-gray-100' : 'text-gray-400 hover:bg-gray-800';
    const saveBtnInactive = theme === 'light' ? 'bg-gray-100 text-gray-400' : 'bg-gray-800 text-gray-600';

    const isValid = title.trim().length > 0 && chapterNumber > 0;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className={backdropClass}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            onClose();
                        }
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 10 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className={`${modalBg} rounded-2xl shadow-2xl w-full max-w-[400px] overflow-hidden border ${modalBorder}`}
                    >
                        {/* Clean Header */}
                        <div className="flex items-center justify-between px-5 pt-5 pb-1">
                            <div>
                                <h2 className={`text-lg font-bold ${textPrimary} mb-0.5`}>
                                    {type === 'draft' ? 'Thêm Bản Nháp' : 'Thêm Chapter Mới'}
                                </h2>
                                <p className={`text-xs ${textSecondary}`}>
                                    {type === 'published' ? 'Tạo chương mới' : 'Tạo bản nháp mới'}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className={`p-1.5 rounded-full transition-colors ${closeBtnHover}`}
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="px-5 py-4 space-y-3">
                            {/* Chapter Number Input */}
                            <div className="space-y-1">
                                <label className={`text-[10px] font-bold uppercase tracking-wider ${textSecondary} ml-1`}>
                                    Chương số
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={chapterNumber}
                                    onChange={(e) => setChapterNumber(Number(e.target.value))}
                                    className={`w-full px-3 py-2 ${inputBg} border ${inputBorder} rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all ${textPrimary} text-sm font-medium placeholder-gray-400`}
                                    placeholder="VD: 1"
                                />
                            </div>

                            {/* Title Input */}
                            <div className="space-y-1">
                                <label className={`text-[10px] font-bold uppercase tracking-wider ${textSecondary} ml-1`}>
                                    Tiêu đề
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className={`w-full px-3 py-2 ${inputBg} border ${inputBorder} rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all ${textPrimary} text-sm font-medium placeholder-gray-400`}
                                    placeholder="Nhập tiêu đề chapter..."
                                />
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="px-5 pb-5 pt-1 flex items-center justify-end gap-2">
                            <button
                                onClick={onClose}
                                className={`px-4 py-2 rounded-lg transition-colors font-medium text-xs ${cancelBtn}`}
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={handleCreateChapter}
                                disabled={!isValid || isPending}
                                className={`px-4 py-2 rounded-lg font-medium text-xs flex items-center gap-1.5 transition-all ${!isValid || isPending
                                    ? `${saveBtnInactive} cursor-not-allowed`
                                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40'
                                    }`}
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        <span>Đang tạo...</span>
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>Tạo mới</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default CreateChapterPopup;
