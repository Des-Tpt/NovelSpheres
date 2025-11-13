import { useState, useEffect } from 'react';
import { Star, X, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRating, createRating, updateRating } from '@/action/rateAction';
import { notifyError, notifySuccess } from '@/utils/notify';
import { motion, AnimatePresence } from 'framer-motion';

interface RatingPopupProps {
    isOpen: boolean;
    onClose: () => void;
    novelId: string;
    userId: string;
}

const ratingDescriptions = {
    1: {
        title: "Rất tệ",
        description: "Tác phẩm có nhiều vấn đề nghiêm trọng về nội dung, lỗi chính tả hoặc cốt truyện không hợp lý."
    },
    2: {
        title: "Tệ",
        description: "Tác phẩm có một số khuyết điểm đáng kể, cần cải thiện nhiều về chất lượng."
    },
    3: {
        title: "Trung bình",
        description: "Tác phẩm ở mức độ bình thường, có thể đọc được nhưng chưa thực sự ấn tượng."
    },
    4: {
        title: "Tốt",
        description: "Tác phẩm hay và hấp dẫn, có nội dung chất lượng và đáng để theo dõi."
    },
    5: {
        title: "Xuất sắc",
        description: "Tác phẩm tuyệt vời với nội dung độc đáo, hấp dẫn và chất lượng cao."
    }
};

export default function RatingPopup({ isOpen, onClose, novelId, userId }: RatingPopupProps) {
    const [rating, setRating] = useState<number>(0);
    const [textRate, setTextRate] = useState<string>('');
    const [hoverRating, setHoverRating] = useState<number>(0);
    const queryClient = useQueryClient();

    // Get existing rating
    const { data: ratingData, isLoading } = useQuery({
        queryKey: ['rating', novelId, userId],
        queryFn: () => getRating(novelId, userId),
        enabled: isOpen && !!novelId && !!userId,
    });

    // Create rating mutation
    const createMutation = useMutation({
        mutationFn: (data: { novelId: string; userId: string; score: number; rate: string }) => createRating(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['novelDetail', novelId] });
            queryClient.invalidateQueries({ queryKey: ['rating', novelId, userId] });
            queryClient.invalidateQueries({ queryKey: ['feature-novels'] });
            queryClient.invalidateQueries({ queryKey: ['ratingData', novelId] });

            notifySuccess('Đánh giá đã được gửi thành công!');
            setTimeout(() => {
                onClose();
            }, 100);
        },
        onError: (error: Error) => {
            notifyError(error.message);
        },
    });

    // Update rating mutation  
    const updateMutation = useMutation({
        mutationFn: (data: { novelId: string; userId: string; score: number; rate: string; }) => updateRating(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['novelDetail', novelId] });
            queryClient.invalidateQueries({ queryKey: ['rating', novelId, userId] });
            queryClient.invalidateQueries({ queryKey: ['ratingData', novelId] });

            notifySuccess('Đánh giá đã được cập nhật thành công!');
            setTimeout(() => {
                onClose();
            }, 100);
        },
        onError: (error: Error) => {
            notifyError(error.message);
        },
    });

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

    // Define isSubmitting first
    const isSubmitting = createMutation.isPending || updateMutation.isPending;

    // Set initial rating when data loads
    useEffect(() => {
        if (ratingData?.rated && ratingData?.ratings?.score && ratingData?.ratings?.rate) {
            setRating(ratingData.ratings.score);
            setTextRate(ratingData.ratings.rate)
        }
    }, [ratingData]);

    // Reset on close
    const resetForm = () => {
        setRating(0);
        setHoverRating(0);
    };

    useEffect(() => {
        if (!isOpen) {
            resetForm();
        }
    }, [isOpen]);

    const handleSubmit = () => {
        if (rating > 0) {
            const data = { novelId, userId, score: rating, rate: textRate };

            if (ratingData?.rated) {
                updateMutation.mutate(data);
            } else {
                createMutation.mutate(data);
            }
        }
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    // Handle backdrop click
    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget && !isSubmitting) {
            handleClose();
        }
    };

    // Handle ESC key
    useEffect(() => {
        const handleEscKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !isSubmitting) {
                handleClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscKey);
        }

        return () => {
            document.removeEventListener('keydown', handleEscKey);
        };
    }, [isOpen, isSubmitting]);

    const currentRating = hoverRating || rating;
    const currentDescription = currentRating > 0 ? ratingDescriptions[currentRating as keyof typeof ratingDescriptions] : null;

    if (!isOpen) return null;

    return (
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
                className="bg-gray-900 rounded-lg p-6 w-full max-w-md border border-gray-700 relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Loading Overlay */}
                <AnimatePresence>
                    {(isSubmitting || isLoading) && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-gray-900/80 rounded-lg flex items-center justify-center z-10"
                        >
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
                                <p className="text-sm text-gray-300">
                                    {isLoading ? 'Đang tải...' : 'Đang xử lý đánh giá...'}
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-white">
                        {ratingData?.rated ? 'Cập nhật đánh giá' : 'Đánh giá tác phẩm'}
                    </h2>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleClose}
                        className="hover:text-yellow-300 transition-colors text-gray-400 disabled:opacity-50 p-1 rounded-md"
                        disabled={isSubmitting}
                    >
                        <X size={20} />
                    </motion.button>
                </div>

                {/* Rating Section */}
                <div className="space-y-6">
                    <div className="flex justify-center gap-2 py-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() => setRating(star)}
                                disabled={isSubmitting}
                                className="hover:cursor-pointer transition-all duration-150 ease-out hover:scale-110 active:scale-95 disabled:cursor-not-allowed p-1"
                            >
                                <Star
                                    size={36}
                                    className={`${star <= currentRating
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-600 hover:text-gray-500'
                                        } transition-colors duration-150`}
                                />
                            </button>
                        ))}
                    </div>

                    <div className="min-h-[80px] flex items-center justify-center">
                        {currentDescription ? (
                            <motion.div
                                key={`description-${currentRating}`}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className="text-center space-y-2 w-full"
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <span className="text-yellow-400 text-lg font-medium">
                                        {currentRating} sao
                                    </span>
                                    <span className="text-gray-300">-</span>
                                    <span className="text-white font-medium">
                                        {currentDescription.title}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-400 leading-relaxed px-2">
                                    {currentDescription.description}
                                </p>
                            </motion.div>
                        ) : ratingData?.rated && ratingData.ratings ? (
                            <motion.div
                                initial={{ opacity: 1 }}
                                className="text-center space-y-2 w-full"
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <span className="text-yellow-400 text-lg font-medium">
                                        {ratingData.ratings.score} sao
                                    </span>
                                    <span className="text-gray-300">-</span>
                                    <span className="text-white font-medium">
                                        {ratingDescriptions[ratingData.ratings.score as keyof typeof ratingDescriptions]?.title}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-400 leading-relaxed px-2">
                                    {ratingDescriptions[ratingData.ratings.score as keyof typeof ratingDescriptions]?.description}
                                </p>
                                <div className="text-xs text-gray-500 mt-2">
                                    Hover vào sao để xem đánh giá khác
                                </div>
                            </motion.div>
                        ) : (
                            <div className="text-center text-gray-500 text-sm">
                                Chọn số sao để đánh giá tác phẩm
                            </div>
                        )}
                    </div>

                    {ratingData?.rated && !hoverRating && !currentDescription && ratingData.ratings && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gray-800/50 rounded-lg p-3 text-center border border-gray-600"
                        >
                            <div className="text-sm text-gray-400 mb-1">
                                Đánh giá hiện tại của bạn:
                            </div>
                            <div className="text-yellow-400 font-medium">
                                {ratingData.ratings.score} sao - {ratingDescriptions[ratingData.ratings.score as keyof typeof ratingDescriptions]?.title}
                            </div>
                        </motion.div>
                    )}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <textarea
                            value={textRate}
                            placeholder='Vui lòng viết đánh giá của bạn tại đây...'
                            onChange={(e) => {
                                setTextRate(e.target.value);
                            }}
                            className="w-full h-32 px-3 py-2 bg-black border-2 border-blue-500 rounded text-white focus:outline-none focus:border-blue-400 transition-colors disabled:opacity-50"
                            disabled={createMutation.isPending}
                        />
                    </motion.div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={handleClose}
                            className="flex-1 px-4 py-2.5 hover:cursor-pointer border border-gray-600 text-white rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                            disabled={isSubmitting}
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={rating === 0 || isSubmitting}
                            className={`hover:cursor-pointer flex-1 px-4 py-2.5 rounded-md transition-all font-medium flex items-center justify-center gap-2 ${rating > 0 && !isSubmitting
                                ? 'bg-yellow-500 hover:bg-yellow-400 text-black shadow-lg hover:shadow-xl'
                                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                }`}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Đang xử lý...
                                </>
                            ) : (
                                <>
                                    <Star size={16} className="fill-current" />
                                    {ratingData?.rated ? 'Cập nhật đánh giá' : 'Gửi đánh giá'}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}