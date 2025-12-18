'use client'
import { getRatingsForContainer } from "@/action/rateAction";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useRef, useCallback, useState } from "react";
import LoadingComponent from "../ui/Loading";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X } from "lucide-react";
// import { likeRating } from "@/action/likeAction";
import getImage from "@/action/imageActions";
import Image from "next/image";

interface RatingData {
    _id: string;
    userId: {
        _id: string;
        username: string;
        role: string;
        profile?: {
            profileId?: string;
            avatar?: {
                publicId?: string;
                format?: string;
            }
        }
    },
    score: number;
    rate: string;
    likes: {
        count: number;
        userIds: string[];
    }
    createdAt?: string;
}

interface RatingResponse {
    ratings?: RatingData[];
    hasMore: boolean;
}

interface RatingsContainerProps {
    isOpen: boolean;
    onClose: () => void;
    novelId: string;
    currentUserId?: string;
}

const cloudname = process.env.NEXT_PUBLIC_CLOUDINARY_NAME! as string;
const defaultFallback = `https://res.cloudinary.com/${cloudname}/image/upload/LightNovel/BookCover/96776418_p0_qov0r8.png`;

const RatingsContainer: React.FC<RatingsContainerProps> = ({ isOpen, onClose, novelId, currentUserId }) => {
    const observerTarget = useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();
    const [avatars, setAvatar] = useState<Record<string, string>>({});

    const { data, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage } = useInfiniteQuery<RatingResponse>({
        queryKey: ["ratings", novelId],
        queryFn: ({ pageParam = 1 }) =>
            getRatingsForContainer({ novelId, page: pageParam as number }),
        getNextPageParam: (lastPage, pages) =>
            lastPage.hasMore ? pages.length + 1 : undefined,
        initialPageParam: 1,
        enabled: isOpen,
    });

    const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
        const [target] = entries;
        if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

    useEffect(() => {
        const element = observerTarget.current;
        const option = { threshold: 0.1 };
        const observer = new IntersectionObserver(handleObserver, option);

        if (element) observer.observe(element);
        return () => {
            if (element) observer.unobserve(element);
        };
    }, [handleObserver]);

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

    const getTimeAgo = (date: string | undefined) => {
        if (!date) return 'Gần đây';
        const diffDays = Math.floor((new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
        return diffDays === 0 ? 'Hôm nay' : `${diffDays} ngày`;
    };

    const allRatings = data?.pages.flatMap(page => page.ratings || []) || [];

    // const likeMutation = useMutation({
    //     mutationFn: likeRating,
    //     onSuccess: (res: any) => {
    //         const newRating = res.rating;

    //         queryClient.setQueryData(['ratings', novelId], (oldData: any) => {
    //             if (!oldData) return;
    //             return {
    //                 ...oldData,
    //                 ratings: oldData.ratings.map((rating: any) =>
    //                     rating._id === newRating._id ? newRating : rating
    //                 )
    //             };
    //         });
    //     }
    // });

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.2 } },
        exit: { opacity: 0, transition: { duration: 0.2 } }
    };

    const modalVariants = {
        hidden: { scale: 0.95, opacity: 0 },
        visible: { scale: 1, opacity: 1, transition: { duration: 0.2 } },
        exit: { scale: 0.95, opacity: 0, transition: { duration: 0.2 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    };

    useEffect(() => {
        if (allRatings.length < 1) return;

        const fetchImage = async () => {
            for (let rating of allRatings) {
                const publicId = rating.userId.profile?.avatar?.publicId;
                const format = rating.userId.profile?.avatar?.format;
                if (publicId && !avatars[publicId]) {
                    const res = await getImage(publicId, format);
                    if (res) setAvatar((prev) => ({ ...prev, [publicId]: res }));
                }
            }
        }

        fetchImage();
    }, [allRatings]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    <motion.div
                        variants={modalVariants}
                        className="relative w-full max-w-3xl max-h-[85vh] bg-gray-950 border border-blue-500 rounded-lg flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center p-4 border-b border-blue-600">
                            <h2 className="text-white text-[1.4rem] font-semibold">
                                Tất cả đánh giá ({allRatings.length})
                            </h2>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {isFetching && allRatings.length === 0 ? (
                                <LoadingComponent />
                            ) : allRatings.length === 0 ? (
                                <div className="text-center text-gray-400 py-8">
                                    Chưa có đánh giá nào
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {allRatings.map((rating, index) => (
                                        <motion.div
                                            key={rating._id}
                                            variants={itemVariants}
                                            initial="hidden"
                                            animate="visible"
                                            transition={{ delay: index * 0.05 }}
                                            className="border border-blue-600 rounded-lg p-4 hover:border-blue-400 transition-colors"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-3">
                                                    <Image
                                                        src={rating.userId.profile?.avatar?.publicId ? avatars[rating.userId.profile?.avatar?.publicId] : defaultFallback}
                                                        alt={rating.userId.username}
                                                        width={40}
                                                        height={40}
                                                        className='rounded-full object-cover mt-1 flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10'
                                                    />
                                                    <div>
                                                        <p className="text-[1.1rem] font-bold text-blue-400">
                                                            {rating.userId.username}
                                                        </p>
                                                        <span className="text-[0.9rem] text-gray-500">
                                                            {getTimeAgo(rating.createdAt)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-0.5">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            size={18}
                                                            className={
                                                                i < rating.score
                                                                    ? 'fill-yellow-400 text-yellow-400'
                                                                    : 'text-gray-600'
                                                            }
                                                        />
                                                    ))}
                                                </div>
                                            </div>

                                            <p className="text-[1.05rem] text-gray-300 leading-relaxed">
                                                {rating.rate}
                                            </p>

                                            <div className="flex items-center gap-4 mt-3 text-gray-500 text-[0.95rem]">
                                                <span>{rating.likes.count} lượt thích</span>
                                            </div>
                                        </motion.div>
                                    ))}

                                    {/* Observer target for infinite scroll */}
                                    <div ref={observerTarget} className="h-4" />

                                    {isFetchingNextPage && (
                                        <div className="text-center py-4">
                                            <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    )}

                                    {!hasNextPage && allRatings.length > 0 && (
                                        <div className="text-center text-gray-500 py-4">
                                            Đã hiển thị tất cả đánh giá
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default RatingsContainer;