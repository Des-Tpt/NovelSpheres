'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, AlertTriangle, Trash2 } from 'lucide-react';

interface DeleteConfirmPopupProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    isPending: boolean;
    theme: 'light' | 'dark';
}

const DeleteConfirmPopup = ({ isOpen, onClose, onConfirm, title, message, isPending, theme }: DeleteConfirmPopupProps) => {
    const backdropClass = "fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm";
    const modalBg = theme === 'light' ? 'bg-white' : 'bg-gray-900';
    const modalBorder = theme === 'light' ? 'border-gray-100' : 'border-gray-800';
    const textPrimary = theme === 'light' ? 'text-gray-900' : 'text-white';
    const textSecondary = theme === 'light' ? 'text-gray-500' : 'text-gray-400';

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
                        if (e.target === e.currentTarget && !isPending) {
                            onClose();
                        }
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 10 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className={`${modalBg} rounded-2xl shadow-2xl w-full max-w-[360px] overflow-hidden border ${modalBorder}`}
                    >
                        <div className="p-6 flex flex-col items-center text-center">
                            <div className={`w-12 h-12 rounded-full mb-4 flex items-center justify-center ${theme === 'light' ? 'bg-red-100 text-red-600' : 'bg-red-900/30 text-red-500'}`}>
                                <Trash2 className="w-6 h-6" />
                            </div>

                            <h2 className={`text-xl font-bold mb-2 ${textPrimary}`}>
                                {title}
                            </h2>

                            <p className={`text-sm mb-6 ${textSecondary}`}>
                                {message}
                            </p>

                            <div className="flex items-center gap-3 w-full">
                                <button
                                    onClick={onClose}
                                    disabled={isPending}
                                    className={`flex-1 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors ${theme === 'light'
                                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            : 'bg-gray-800 text-gray-300 hover:bg-gray-750'
                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    onClick={onConfirm}
                                    disabled={isPending}
                                    className={`flex-1 px-4 py-2.5 rounded-xl font-medium text-sm text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    {isPending ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Đang xóa...</span>
                                        </>
                                    ) : (
                                        <span>Xóa ngay</span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default DeleteConfirmPopup;
