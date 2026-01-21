import React, { useState, useEffect } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateAct } from '@/action/novelActions'; // Assume this action exists
import { notifyError, notifySuccess } from '@/utils/notify';
import { motion, AnimatePresence } from 'framer-motion';

interface ActData {
    _id: string;
    title: string;
    actType: string;
    actNumber: number;
    fileUrl?: string;
}

interface EditActPopupProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    novelId: string;
    actData: ActData | null;
}

const EditActPopup: React.FC<EditActPopupProps> = ({ isOpen, onClose, userId, novelId, actData }) => {
    const [title, setTitle] = useState<string>('');
    const [actType, setActType] = useState<string>('');
    const [actNumberStr, setActNumberStr] = useState<string>("1");
    const [actNumber, setActNumber] = useState<number>(1);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [removeCurrentFile, setRemoveCurrentFile] = useState<boolean>(false);
    const queryClient = useQueryClient();
    const mouseDownTargetRef = React.useRef<EventTarget | null>(null);

    // Load act data when popup opens or actData changes
    useEffect(() => {
        if (isOpen && actData) {
            setTitle(actData.title || '');
            setActType(actData.actType || '');
            setActNumberStr(actData.actNumber.toString() || "1");
            setActNumber(actData.actNumber || 1);
            setSelectedFile(null);
            setRemoveCurrentFile(false);
        }
    }, [isOpen, actData]);

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
        if (file) {
            setRemoveCurrentFile(false);
        }
    };

    // Separate reset function
    const resetForm = () => {
        setTitle('');
        setActType('');
        setActNumber(1);
        setSelectedFile(null);
        setRemoveCurrentFile(false);
    };

    const updateActMutation = useMutation({
        mutationFn: updateAct,
        onSuccess: (res) => {
            queryClient.setQueryData(['novelDetail', novelId], (oldData: any) => {
                if (!oldData) return oldData;
                return {
                    ...oldData,
                    acts: oldData.acts.map((act: ActData) =>
                        act._id === res.newAct._id
                            ? { ...act, ...res.newAct }
                            : act
                    ),
                };
            });
            notifySuccess('Cập nhật act thành công!');
            resetForm();
            setTimeout(() => {
                onClose();
            }, 100);
        },
        onError: (error) => {
            notifyError(error.message);
        }
    });

    const handleSubmit = async () => {
        if (!title.trim()) {
            alert('Vui lòng nhập tên Act');
            return;
        }

        if (!actData) {
            notifyError('Không tìm thấy thông tin Act để cập nhật');
            return;
        }

        const updateData = {
            actId: actData._id,
            userId,
            novelId,
            title: title.trim(),
            actNumber,
            actType,
            ...(selectedFile && { file: selectedFile }),
            ...(removeCurrentFile && { removeFile: true })
        };

        try {
            await updateActMutation.mutateAsync(updateData);
        } catch (error) {
            console.error('Error updating act:', error);
        }
    };

    const handleClose = () => {
        resetForm();
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
            !updateActMutation.isPending
        ) {
            handleClose();
        }
        mouseDownTargetRef.current = null;
    };

    // Handle ESC key
    useEffect(() => {
        const handleEscKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !updateActMutation.isPending) {
                handleClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscKey);
        }

        return () => {
            document.removeEventListener('keydown', handleEscKey);
        };
    }, [isOpen, updateActMutation.isPending]);

    const handleRemoveCurrentFile = () => {
        setRemoveCurrentFile(true);
        setSelectedFile(null);
    };

    if (!actData) return null;

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
                        className="bg-gray-900 rounded-lg p-6 w-full max-w-md border border-gray-700 relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Loading Overlay */}
                        <AnimatePresence>
                            {updateActMutation.isPending && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-gray-900/80 rounded-lg flex items-center justify-center z-10"
                                >
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                                        <p className="text-sm text-gray-300">Đang cập nhật phần...</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-white">Sửa phần</h2>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={handleClose}
                                className="hover:text-yellow-300 transition-colors text-gray-400 disabled:opacity-50"
                                disabled={updateActMutation.isPending}
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
                                    disabled={updateActMutation.isPending}
                                />
                            </motion.div>

                            {/* Act Number */}
                            <motion.div
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className='flex gap-2 w-full'
                            >
                                <div className='w-[40%]'>
                                    <label className="block text-sm font-medium mb-2 text-gray-300">
                                        Số thứ tự phần *
                                    </label>
                                    <input
                                        type="number"
                                        value={actNumberStr}
                                        onChange={(e) => {
                                            setActNumberStr(e.target.value);
                                        }}
                                        onBlur={() => {
                                            const num = parseInt(actNumberStr, 10);
                                            if (isNaN(num)) {
                                                setActNumberStr("1");
                                                setActNumber(1);
                                            } else {
                                                setActNumberStr(String(num));
                                                setActNumber(num);
                                            }
                                        }}
                                        className="w-full px-3 py-2 bg-black border-2 border-blue-500 rounded text-white focus:outline-none focus:border-blue-400 transition-colors disabled:opacity-50"
                                        disabled={updateActMutation.isPending}
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
                                        disabled={updateActMutation.isPending}
                                    />
                                </div>
                            </motion.div>

                            {/* Removed File Notice */}
                            {removeCurrentFile && (
                                <motion.div
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    className="p-3 bg-red-900/20 rounded border border-red-600"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-red-400">
                                            Tệp sẽ được xóa khi lưu
                                        </div>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setRemoveCurrentFile(false)}
                                            className="text-gray-400 hover:text-gray-300 text-sm px-2 py-1 rounded hover:bg-gray-700 transition-colors"
                                            disabled={updateActMutation.isPending}
                                        >
                                            Hoàn tác
                                        </motion.button>
                                    </div>
                                </motion.div>
                            )}

                            {/* File Upload */}
                            <motion.div
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                <label className="block text-sm font-medium mb-2 text-gray-300">
                                    {actData.fileUrl ? 'Thay đổi tệp' : 'Tải lên tệp (tùy chọn)'}
                                </label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        onChange={handleFileChange}
                                        className="hidden"
                                        id="file-upload"
                                        accept=".jpg,.png,.jpeg"
                                        disabled={updateActMutation.isPending}
                                    />
                                    <motion.label
                                        whileHover={{ scale: updateActMutation.isPending ? 1 : 1.02 }}
                                        whileTap={{ scale: updateActMutation.isPending ? 1 : 0.98 }}
                                        htmlFor="file-upload"
                                        className={`w-full px-3 py-2 bg-black border border-gray-600 rounded text-white cursor-pointer hover:border-blue-400 transition-colors flex items-center gap-2 ${updateActMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''
                                            }`}
                                    >
                                        <Upload size={16} />
                                        {selectedFile ? selectedFile.name : 'Chọn tệp mới nếu bạn muốn thay đổi ảnh bìa...'}
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
                                    whileHover={{ scale: updateActMutation.isPending ? 1 : 1.02 }}
                                    whileTap={{ scale: updateActMutation.isPending ? 1 : 0.98 }}
                                    onClick={handleClose}
                                    className="flex-1 px-4 py-2 border cursor-pointer border-gray-600 text-white rounded hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={updateActMutation.isPending}
                                >
                                    Hủy
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: updateActMutation.isPending ? 1 : 1.02 }}
                                    whileTap={{ scale: updateActMutation.isPending ? 1 : 0.98 }}
                                    onClick={handleSubmit}
                                    className="flex-1 px-4 py-2 bg-blue-600 cursor-pointer text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    disabled={updateActMutation.isPending}
                                >
                                    {updateActMutation.isPending ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Đang cập nhật...
                                        </>
                                    ) : (
                                        'Cập nhật Act'
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

export default EditActPopup;