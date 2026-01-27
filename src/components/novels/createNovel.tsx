import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Upload, Loader2, AlertTriangle, Info } from 'lucide-react';
import { createNovel } from '@/action/novelActions';
import { notifyError, notifySuccess } from '@/utils/notify';
import { motion, AnimatePresence } from 'framer-motion';
import TiptapEditor from '@/components/ui/TiptapEditor';

interface Genre {
    _id: string;
    name: string;
}

interface CreateNovelPopupProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    genres: Genre[];
}

const CreateNovelPopup: React.FC<CreateNovelPopupProps> = ({ isOpen, onClose, userId, genres = [] }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        status: 'Ongoing',
        genresId: [] as string[]
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewImage, setPreviewImage] = useState<string>('');

    const queryClient = useQueryClient();

    // Reset form when popup opens
    useEffect(() => {
        if (isOpen) {
            setFormData({
                title: '',
                description: '',
                status: 'Ongoing',
                genresId: []
            });
            setPreviewImage('');
            setSelectedFile(null);
        }
    }, [isOpen]);

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

    const mutation = useMutation({
        mutationFn: createNovel,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['novels'] });
            queryClient.invalidateQueries({ queryKey: ['userNovels'] });
            notifySuccess('Tạo tiểu thuyết thành công!');
            resetForm();
            setTimeout(() => {
                onClose();
            }, 100);
        },
        onError: (error: any) => {
            console.error('Error creating novel:', error);
            notifyError(error.message || 'Có lỗi xảy ra khi tạo tiểu thuyết!');
        }
    });

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            status: 'Ongoing',
            genresId: []
        });
        setSelectedFile(null);
        setPreviewImage('');
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleDescriptionChange = (content: string) => {
        setFormData(prev => ({
            ...prev,
            description: content
        }));
    };

    const handleGenreChange = (genreId: string, checked: boolean) => {
        setFormData(prev => ({
            ...prev,
            genresId: checked
                ? [...prev.genresId, genreId]
                : prev.genresId.filter(id => id !== genreId)
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                notifyError('Kích thước file không được vượt quá 10MB!');
                return;
            }

            if (!file.type.startsWith('image/')) {
                notifyError('Vui lòng chọn file hình ảnh!');
                return;
            }

            setSelectedFile(file);
            const reader = new FileReader();
            reader.onload = (e) => {
                setPreviewImage(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async () => {
        if (!formData.title.trim()) {
            notifyError('Vui lòng nhập tiêu đề!');
            return;
        }

        if (!formData.description.trim()) {
            notifyError('Vui lòng nhập mô tả!');
            return;
        }

        if (formData.genresId.length === 0) {
            notifyError('Vui lòng chọn ít nhất 1 thể loại!');
            return;
        }

        try {
            await mutation.mutateAsync({
                userId,
                title: formData.title,
                description: formData.description,
                status: formData.status,
                genresId: formData.genresId,
                file: selectedFile || undefined
            });
        } catch (error) {
            console.error('Error creating novel:', error);
        }
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    // Handle backdrop click
    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget && !mutation.isPending) {
            handleClose();
        }
    };

    // Handle ESC key
    useEffect(() => {
        const handleEscKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !mutation.isPending) {
                handleClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscKey);
        }

        return () => {
            document.removeEventListener('keydown', handleEscKey);
        };
    }, [isOpen, mutation.isPending]);

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
                        className="bg-gray-900 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700 relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Loading Overlay */}
                        <AnimatePresence>
                            {mutation.isPending && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-gray-900/80 rounded-lg flex items-center justify-center z-10"
                                >
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                                        <p className="text-sm text-gray-300">Đang tạo tiểu thuyết...</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-white">Tạo tiểu thuyết mới</h2>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={handleClose}
                                className="hover:text-yellow-300 cursor-pointer transition-colors text-gray-400 disabled:opacity-50"
                                disabled={mutation.isPending}
                            >
                                <X size={20} />
                            </motion.button>
                        </div>

                        {/* Warning Container */}
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6 space-y-3"
                        >
                            {/* Hướng dẫn tạo novel */}
                            <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <h4 className="text-blue-300 font-medium mb-2">Hướng dẫn tạo tiểu thuyết:</h4>
                                        <ul className="text-sm text-blue-200 space-y-1">
                                            <li>• Tiêu đề và mô tả là bắt buộc</li>
                                            <li>• Bắt buộc phải chọn ít nhất 1 thể loại</li>
                                            <li>• Ảnh bìa là tùy chọn, có thể thêm sau</li>
                                            <li>• Mô tả nên chi tiết để thu hút độc giả</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Cảnh báo về nội dung */}
                            <div className="bg-amber-900/20 border border-amber-600 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <h4 className="text-amber-300 font-medium mb-2">Lưu ý quan trọng:</h4>
                                        <ul className="text-sm text-amber-200 space-y-1">
                                            <li>• Không được phép đăng nội dung vi phạm pháp luật</li>
                                            <li>• Ảnh bìa không phù hợp có thể bị xóa và khóa tài khoản</li>
                                            <li>• Chỉ chấp nhận file ảnh JPG, PNG tối đa 10MB</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        <div className="space-y-4">
                            {/* Title */}
                            <motion.div
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                            >
                                <label className="block text-sm font-medium mb-2 text-gray-300">
                                    Tiêu đề <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    placeholder="Nhập tiêu đề tiểu thuyết..."
                                    className="w-full px-3 py-2 bg-black border-2 border-blue-500 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors disabled:opacity-50"
                                    disabled={mutation.isPending}
                                />
                                {formData.title.length > 100 && (
                                    <p className="text-amber-400 text-xs mt-1">
                                        Tiêu đề khá dài ({formData.title.length} ký tự). Khuyến nghị dưới 100 ký tự.
                                    </p>
                                )}
                            </motion.div>

                            {/* Description */}
                            <motion.div
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                <label className="block text-sm font-medium mb-2 text-gray-300">
                                    Mô tả <span className="text-red-400">*</span>
                                </label>
                                <TiptapEditor
                                    content={formData.description}
                                    onChange={handleDescriptionChange}
                                    placeholder="Nhập mô tả tiểu thuyết của bạn tại đây..."
                                    minHeight="200px"
                                    maxHeight="350px"
                                />
                                {formData.description && formData.description.length < 50 && (
                                    <p className="text-amber-400 text-xs mt-1">
                                        Mô tả quá ngắn. Nên viết ít nhất 50 ký tự để thu hút độc giả.
                                    </p>
                                )}
                            </motion.div>

                            {/* Status */}
                            <motion.div
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                <label className="block text-sm font-medium mb-2 text-gray-300">
                                    Trạng thái
                                </label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 bg-black border-2 border-blue-500 rounded text-white focus:outline-none focus:border-blue-400 transition-colors disabled:opacity-50"
                                    disabled={mutation.isPending}
                                >
                                    <option value="Ongoing">Đang tiến hành</option>
                                    <option value="Completed">Hoàn thành</option>
                                    <option value="Hiatus">Tạm dừng</option>
                                </select>
                            </motion.div>

                            {/* Genres */}
                            <motion.div
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                            >
                                <label className="block text-sm font-medium mb-2 text-gray-300">
                                    Thể loại <span className="text-red-400">*</span>
                                </label>
                                {genres.length === 0 ? (
                                    <div className="text-gray-400 text-sm py-2 bg-gray-800 rounded border border-gray-600 px-3">
                                        Không có thể loại nào.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto bg-black border-2 border-blue-500 rounded p-3">
                                        {genres.map((genre) => (
                                            <motion.label
                                                key={`${genre._id}-createNovelPopup`}
                                                className="flex items-center space-x-2 cursor-pointer hover:bg-gray-800 p-2 rounded transition-colors"
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={formData.genresId.includes(genre._id)}
                                                    onChange={(e) => handleGenreChange(genre._id, e.target.checked)}
                                                    className="w-4 h-4 text-blue-600 bg-gray-800 border-blue-500 rounded focus:ring-blue-500 focus:ring-2"
                                                    disabled={mutation.isPending}
                                                />
                                                <span className="text-sm text-gray-300">{genre.name}</span>
                                            </motion.label>
                                        ))}
                                    </div>
                                )}
                                {formData.genresId.length > 0 && (
                                    <motion.div
                                        className="mt-2"
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        <span className="text-xs text-green-400">
                                            Đã chọn {formData.genresId.length} thể loại
                                        </span>
                                    </motion.div>
                                )}
                                {formData.genresId.length === 0 && (
                                    <p className="text-red-400 text-xs mt-1">
                                        Bắt buộc phải chọn ít nhất 1 thể loại!
                                    </p>
                                )}
                            </motion.div>

                            {/* Cover Image */}
                            <motion.div
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.5 }}
                            >
                                <label className="block text-sm font-medium mb-2 text-gray-300">
                                    Ảnh bìa (tùy chọn)
                                </label>
                                <div className="space-y-3">
                                    {previewImage && (
                                        <motion.div
                                            className="relative inline-block"
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                        >
                                            <img
                                                src={previewImage}
                                                alt="Preview"
                                                className="w-32 h-48 object-cover rounded-lg border-2 border-blue-500"
                                            />
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => {
                                                    setPreviewImage('');
                                                    setSelectedFile(null);
                                                }}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                                                disabled={mutation.isPending}
                                            >
                                                <X size={12} />
                                            </motion.button>
                                        </motion.div>
                                    )}
                                    <div className="relative">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="hidden"
                                            id="cover-upload"
                                            disabled={mutation.isPending}
                                        />
                                        <motion.label
                                            whileHover={{ scale: mutation.isPending ? 1 : 1.02 }}
                                            whileTap={{ scale: mutation.isPending ? 1 : 0.98 }}
                                            htmlFor="cover-upload"
                                            className={`w-full px-3 py-8 bg-black border-2 border-dashed border-blue-500 rounded text-white cursor-pointer hover:border-blue-400 transition-colors flex flex-col items-center gap-2 ${mutation.isPending ? 'opacity-50 cursor-not-allowed' : ''
                                                }`}
                                        >
                                            <Upload className="w-8 h-8 text-blue-400" />
                                            <span className="text-sm text-gray-300">
                                                {selectedFile ? selectedFile.name : 'Chọn ảnh bìa (tùy chọn)'}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                JPG, PNG tối đa 10MB, khuyến nghị 300x450px
                                            </span>
                                        </motion.label>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Submit Buttons */}
                            <motion.div
                                className="flex gap-3 pt-4"
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.6 }}
                            >
                                <motion.button
                                    whileHover={{ scale: mutation.isPending ? 1 : 1.02 }}
                                    whileTap={{ scale: mutation.isPending ? 1 : 0.98 }}
                                    onClick={handleClose}
                                    className="flex-1 px-4 py-2 border cursor-pointer border-gray-600 text-white rounded hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={mutation.isPending}
                                >
                                    Hủy
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: mutation.isPending ? 1 : 1.02 }}
                                    whileTap={{ scale: mutation.isPending ? 1 : 0.98 }}
                                    onClick={handleSubmit}
                                    className="flex-1 px-4 py-2 bg-green-600 cursor-pointer text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    disabled={mutation.isPending}
                                >
                                    {mutation.isPending ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Đang tạo...
                                        </>
                                    ) : (
                                        'Tạo tiểu thuyết'
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

export default CreateNovelPopup;