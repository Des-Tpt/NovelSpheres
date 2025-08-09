import React, { useState, useEffect } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createAct } from '@/action/novelActions';
import { notifyError, notifySuccess } from '@/utils/notify';
import { motion, AnimatePresence } from 'framer-motion';

interface CreateActPopupProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    novelId: string;
}

const CreateActPopup: React.FC<CreateActPopupProps> = ({ isOpen, onClose, userId, novelId }) => {
    const [title, setTitle] = useState<string>('');
    const [actType, setActType] = useState<string>('');
    const [actNumber, setActNumber] = useState<number>(1);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const queryClient = useQueryClient();

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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setSelectedFile(file);
    };

    // Separate reset function
    const resetForm = () => {
        setTitle('');
        setActType('');
        setActNumber(1);
        setSelectedFile(null);
    };

    const createActMutation = useMutation({
        mutationFn: createAct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['novelDetail', novelId] });
            notifySuccess('Tạo act thành công!');
            resetForm();
            setTimeout(() => {
                onClose();
            }, 100);
        },
        onError: () => {
            notifyError("Tạo act thất bại!");
        }
    });

    const handleSubmit = async () => {
        if (!title.trim()) {
            alert('Vui lòng nhập tên Act');
            return;
        }

        const postData = {
            userId,
            novelId,
            title: title.trim(),
            actNumber,
            actType,
            ...(selectedFile && { file: selectedFile })
        };
        
        try {
            await createActMutation.mutateAsync(postData);
        } catch (error) {
            console.error('Error creating act:', error);
        }
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    // Handle backdrop click
    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget && !createActMutation.isPending) {
            handleClose();
        }
    };

    // Handle ESC key
    useEffect(() => {
        const handleEscKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !createActMutation.isPending) {
                handleClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscKey);
        }

        return () => {
            document.removeEventListener('keydown', handleEscKey);
        };
    }, [isOpen, createActMutation.isPending]);

    return (
        <>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 bg-black/60 flex items-center justify-center z-100 p-4"
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
                        className="bg-gray-900 rounded-lg p-6 w-full max-w-md border border-gray-700 relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Loading Overlay */}
                        <AnimatePresence>
                            {createActMutation.isPending && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-gray-900/80 rounded-lg flex items-center justify-center z-10"
                                >
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                                        <p className="text-sm text-gray-300">Đang tạo phần...</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-white">Tạo phần mới</h2>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={handleClose}
                                className="hover:text-yellow-300 transition-colors text-gray-400 disabled:opacity-50"
                                disabled={createActMutation.isPending}
                            >
                                <X size={20} />
                            </motion.button>
                        </div>

                        <div className="space-y-4">
                            {/* Act Name */}
                            <motion.div
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                            >
                                <label className="block text-sm font-medium mb-2 text-gray-300">
                                    Tên phần *
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Ví dụ: Khởi đầu, Cuộc chiến..."
                                    className="w-full px-3 py-2 bg-black border-2 border-blue-500 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors disabled:opacity-50"
                                    disabled={createActMutation.isPending}
                                />
                            </motion.div>

                            {/* Act Number */}
                            <motion.div
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className='flex gap-2 w-full'
                            >
                                <div className='w-[30%]'>
                                    <label className="block text-sm font-medium mb-2 text-gray-300">
                                        Số thứ tự phần *
                                    </label>
                                    <input
                                        type="number"
                                        value={actNumber}
                                        onChange={(e) => {
                                            const value = parseInt(e.target.value);
                                            setActNumber(isNaN(value) ? 1 : value);
                                        }}
                                        className="w-full px-3 py-2 bg-black border-2 border-blue-500 rounded text-white focus:outline-none focus:border-blue-400 transition-colors disabled:opacity-50"
                                        disabled={createActMutation.isPending}
                                    />
                                </div>
                                <div className='w-[70%]'>
                                    <label className="block text-sm font-medium mb-2 text-gray-300">
                                        Cách gọi của phần
                                    </label>
                                    <input
                                        type="text"
                                        value={actType}
                                        onChange={(e) => setActType(e.target.value)}
                                        placeholder='Ví dụ: Quyển, Hồi... Mặc định là Act...'
                                        className="w-full px-3 py-2 bg-black border-2 border-blue-500 rounded text-white focus:outline-none focus:border-blue-400 transition-colors disabled:opacity-50"
                                        disabled={createActMutation.isPending}
                                    />
                                </div>
                            </motion.div>

                            {/* File Upload */}
                            <motion.div
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                <label className="block text-sm font-medium mb-2 text-gray-300">
                                    Tải lên tệp (tùy chọn)
                                </label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        onChange={handleFileChange}
                                        className="hidden"
                                        id="file-upload"
                                        accept=".jpg,.png,.jpeg"
                                        disabled={createActMutation.isPending}
                                    />
                                    <motion.label
                                        whileHover={{ scale: createActMutation.isPending ? 1 : 1.02 }}
                                        whileTap={{ scale: createActMutation.isPending ? 1 : 0.98 }}
                                        htmlFor="file-upload"
                                        className={`w-full px-3 py-2 bg-black border border-gray-600 rounded text-white cursor-pointer hover:border-blue-400 transition-colors flex items-center gap-2 ${
                                            createActMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                    >
                                        <Upload size={16} />
                                        {selectedFile ? selectedFile.name : 'Chọn tệp...'}
                                    </motion.label>
                                </div>
                            </motion.div>

                            {/* Buttons */}
                            <motion.div
                                className="flex gap-3 pt-4"
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                            >
                                <motion.button
                                    whileHover={{ scale: createActMutation.isPending ? 1 : 1.02 }}
                                    whileTap={{ scale: createActMutation.isPending ? 1 : 0.98 }}
                                    onClick={handleClose}
                                    className="flex-1 px-4 py-2 border border-gray-600 text-white rounded hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={createActMutation.isPending}
                                >
                                    Hủy
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: createActMutation.isPending ? 1 : 1.02 }}
                                    whileTap={{ scale: createActMutation.isPending ? 1 : 0.98 }}
                                    onClick={handleSubmit}
                                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    disabled={createActMutation.isPending}
                                >
                                    {createActMutation.isPending ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Đang tạo...
                                        </>
                                    ) : (
                                        'Tạo Act'
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

export default CreateActPopup;