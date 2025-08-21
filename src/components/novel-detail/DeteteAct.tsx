import React, { useEffect } from 'react';
import { deleteAct } from "@/action/novelActions";
import { notifyError, notifySuccess } from "@/utils/notify";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { X, AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DeleteActPopupProps {
    isOpen: boolean;
    onClose: () => void;
    actData: {
        actId: string;
        actName?: string;
        userId: string;
        novelId: string;
    };
}

const DeleteActPopup: React.FC<DeleteActPopupProps> = ({ isOpen, onClose, actData }) => {
    const params = useParams();
    const novelId = params.id;
    const queryClient = useQueryClient();

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

    const deleteMutation = useMutation({
        mutationFn: deleteAct,
        onSuccess: (response) => {
            queryClient.setQueryData(['novelDetail', novelId], (oldData: any) => {
                if (!oldData) return oldData;
                return {
                    ...oldData,
                    acts: oldData.acts.filter((act: any) => act._id !== response.deleteActId)
                };
            })
            notifySuccess('Xóa act thành công!');
            setTimeout(() => {
                onClose();
            }, 100);
        },
        onError: (error: any) => {
            notifyError(error?.message || 'Xóa act thất bại!');
        }
    });

    const handleDelete = () => {
        deleteMutation.mutate({
            actId: actData.actId,
            userId: actData.userId,
            novelId: actData.novelId
        });
    };

    const handleClose = () => {
        if (deleteMutation.isPending) return;
        onClose();
    };

    // Handle backdrop click
    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget && !deleteMutation.isPending) {
            handleClose();
        }
    };

    // Handle ESC key
    useEffect(() => {
        const handleEscKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !deleteMutation.isPending) {
                handleClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscKey);
        }

        return () => {
            document.removeEventListener('keydown', handleEscKey);
        };
    }, [isOpen, deleteMutation.isPending]);

    return (
        <>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 bg-black/60 flex items-center justify-center z-70 p-4"
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
                        className="bg-gray-900 rounded-lg p-6 w-full max-w-md border border-gray-700 relative overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Loading Overlay */}
                        <AnimatePresence>
                            {deleteMutation.isPending && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-gray-900/80 rounded-lg flex items-center justify-center z-10"
                                >
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
                                        <p className="text-sm text-gray-300">Đang xóa Act...</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <motion.h2
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className="text-lg font-semibold text-white flex items-center gap-2"
                            >
                                <AlertTriangle size={20} className="text-red-500" />
                                Xác nhận xóa Act
                            </motion.h2>
                            <motion.button
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={handleClose}
                                className="hover:text-red-300 transition-colors text-gray-400 cursor-pointer disabled:opacity-50"
                                disabled={deleteMutation.isPending}
                            >
                                <X size={20} />
                            </motion.button>
                        </div>

                        {/* Content */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="space-y-4"
                        >
                            {/* Warning Icon and Message */}
                            <div className="flex items-start gap-3">
                                <div className="w-12 h-12 bg-red-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                    <Trash2 className="w-6 h-6 text-red-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-gray-300 mb-2">
                                        Bạn có chắc chắn muốn xóa act{' '}
                                        {actData.actName && (
                                            <span className="font-medium text-white">"{actData.actName}"</span>
                                        )} không?
                                    </p>
                                    <p className="text-sm text-red-400">
                                        Hành động này không thể hoàn tác và sẽ xóa vĩnh viễn tất cả dữ liệu liên quan.
                                    </p>
                                </div>
                            </div>

                            {/* Warning Card */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="bg-red-900/20 border border-red-700/30 rounded-lg p-3"
                            >
                                <h4 className="text-sm font-medium text-red-300 mb-2">⚠️ Cảnh báo</h4>
                                <div className="text-sm text-gray-400 space-y-1">
                                    <p>• Tất cả chapters trong act này sẽ bị xóa</p>
                                    <p>• Dữ liệu không thể khôi phục sau khi xóa</p>
                                    <p>• Hãy chắc chắn trước khi thực hiện</p>
                                </div>
                            </motion.div>
                        </motion.div>

                        {/* Buttons */}
                        <motion.div
                            className="flex gap-3 mt-6"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                        >
                            <motion.button
                                whileHover={{ scale: deleteMutation.isPending ? 1 : 1.02 }}
                                whileTap={{ scale: deleteMutation.isPending ? 1 : 0.98 }}
                                onClick={handleClose}
                                className="flex-1 px-4 py-2 border border-gray-600 cursor-pointer text-white rounded hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={deleteMutation.isPending}
                            >
                                Hủy
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: deleteMutation.isPending ? 1 : 1.02 }}
                                whileTap={{ scale: deleteMutation.isPending ? 1 : 0.98 }}
                                onClick={handleDelete}
                                className="flex-1 px-4 py-2 bg-red-600 cursor-pointer text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                disabled={deleteMutation.isPending}
                            >
                                {deleteMutation.isPending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Đang xóa...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 size={16} />
                                        Xóa Act
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

export default DeleteActPopup;