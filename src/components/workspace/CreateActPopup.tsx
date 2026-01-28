'use client';

import { useState, useEffect } from 'react';
import { createAct } from '@/action/novelActions';
import { notifyError, notifySuccess } from '@/utils/notify';
import { motion, AnimatePresence } from 'framer-motion';
import { getUserFromCookies } from '@/action/userAction';
import { X, Loader2, Plus, Layers } from 'lucide-react';

interface CreateActPopupProps {
    novelId: string;
    isOpen: boolean;
    onClose: () => void;
    theme: 'light' | 'dark';
    onUpdate: () => void;
}

const CreateActPopup = ({ novelId, isOpen, onClose, theme, onUpdate }: CreateActPopupProps) => {
    const [title, setTitle] = useState<string>('');
    const [actNumber, setActNumber] = useState<number>(1);
    const [actType, setActType] = useState<string>('Hồi');
    const [isPending, setIsPending] = useState<boolean>(false);
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        const fetchUser = async () => {
            let data = await getUserFromCookies();
            setCurrentUser(data);
        }
        fetchUser();
    }, []);

    const handleCreateAct = async () => {
        setIsPending(true);
        if (!currentUser) {
            notifyError('Vui lòng đăng nhập để tạo act!');
            setIsPending(false);
            return;
        }

        try {
            await createAct({
                userId: currentUser.user._id.toString(),
                novelId,
                title,
                actNumber,
                actType
            });
            notifySuccess('Tạo hồi mới thành công!');
            onUpdate();
            setTimeout(() => {
                onClose();
                // Reset form
                setTitle('');
                setActNumber(prev => prev + 1);
            }, 100);
        } catch (error: any) {
            console.error('Error creating act:', error);
            notifyError(error?.message || 'Tạo act thất bại!');
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

    const isValid = actNumber > 0 && actType.trim().length > 0;

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
                                <h2 className={`text-lg font-bold ${textPrimary} mb-0.5`}>Thêm Hồi Mới</h2>
                                <p className={`text-xs ${textSecondary}`}>
                                    Tạo nhóm chương mới cho tiểu thuyết
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
                            <div className="grid grid-cols-2 gap-3">
                                {/* Act Type Input */}
                                <div className="space-y-1">
                                    <label className={`text-[10px] font-bold uppercase tracking-wider ${textSecondary} ml-1`}>
                                        Loại (Hồi/Quyển)
                                    </label>
                                    <input
                                        type="text"
                                        value={actType}
                                        onChange={(e) => setActType(e.target.value)}
                                        className={`w-full px-3 py-2 ${inputBg} border ${inputBorder} rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all ${textPrimary} text-sm font-medium placeholder-gray-400`}
                                        placeholder="Hồi"
                                    />
                                </div>

                                {/* Act Number Input */}
                                <div className="space-y-1">
                                    <label className={`text-[10px] font-bold uppercase tracking-wider ${textSecondary} ml-1`}>
                                        Số thứ tự
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={actNumber}
                                        onChange={(e) => setActNumber(Number(e.target.value))}
                                        className={`w-full px-3 py-2 ${inputBg} border ${inputBorder} rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all ${textPrimary} text-sm font-medium placeholder-gray-400`}
                                        placeholder="1"
                                    />
                                </div>
                            </div>

                            {/* Title Input */}
                            <div className="space-y-1">
                                <label className={`text-[10px] font-bold uppercase tracking-wider ${textSecondary} ml-1`}>
                                    Tiêu đề (Không bắt buộc)
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className={`w-full px-3 py-2 ${inputBg} border ${inputBorder} rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all ${textPrimary} text-sm font-medium placeholder-gray-400`}
                                    placeholder="Nhập tên hồi..."
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
                                onClick={handleCreateAct}
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
                                        <Layers className="w-3.5 h-3.5" />
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

export default CreateActPopup;
