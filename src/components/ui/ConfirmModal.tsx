import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export type ConfirmVariant = 'danger' | 'primary' | 'warning';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: ConfirmVariant;
    isLoading?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Xác nhận',
    cancelText = 'Hủy',
    variant = 'primary',
    isLoading = false
}) => {
    const getColors = () => {
        switch (variant) {
            case 'danger':
                return {
                    iconBg: 'bg-red-50 text-red-500',
                    icon: <AlertCircle className="w-6 h-6" />,
                    buttonBg: 'bg-red-500 hover:bg-red-600 focus:ring-red-500/20',
                };
            case 'warning':
                return {
                    iconBg: 'bg-amber-50 text-amber-500',
                    icon: <AlertCircle className="w-6 h-6" />,
                    buttonBg: 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-500/20',
                };
            case 'primary':
            default:
                return {
                    iconBg: 'bg-blue-50 text-blue-500',
                    icon: <CheckCircle2 className="w-6 h-6" />,
                    buttonBg: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500/20',
                };
        }
    };

    const colors = getColors();

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={!isLoading ? onClose : undefined}
                        className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
                        className="relative w-full max-w-md bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-100 overflow-hidden z-10"
                    >
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="absolute top-4 right-4 p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-full transition-colors disabled:opacity-50"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="p-6">
                            <div className="flex flex-col items-center text-center">
                                <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${colors.iconBg}`}>
                                    {colors.icon}
                                </div>

                                <h3 className="text-xl font-bold text-gray-900 mb-2">
                                    {title}
                                </h3>
                                <p className="text-sm text-gray-500 mb-6">
                                    {description}
                                </p>
                            </div>

                            <div className="flex items-center gap-3 w-full mt-2">
                                <button
                                    onClick={onClose}
                                    disabled={isLoading}
                                    className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                                >
                                    {cancelText}
                                </button>
                                <button
                                    onClick={onConfirm}
                                    disabled={isLoading}
                                    className={`flex-1 flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-white rounded-xl shadow-sm transition-all focus:outline-none focus:ring-4 disabled:opacity-70 ${colors.buttonBg}`}
                                >
                                    {isLoading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        confirmText
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ConfirmModal;
