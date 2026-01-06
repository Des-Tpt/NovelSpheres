'use client'
import { dislikeRating, getRatingsForContainer, likeRating } from "@/action/rateAction";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useRef, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ThumbsUp, ThumbsDown, X } from "lucide-react";
import { vi } from 'date-fns/locale';
import { formatDistanceToNow } from 'date-fns';
import getImage from "@/action/imageActions";
import Image from "next/image";
import { notifyError, notifySuccess } from "@/utils/notify";
import handleToProfile from "@/utils/handleToProfile";
import { useRouter } from "next/navigation";

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
    },
    dislikes: {
        count: number;
        userIds: string[];
    },
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

    const getTimeAgo = (updatedAt: string | Date) => {
        return `${formatDistanceToNow(new Date(updatedAt), { addSuffix: true, locale: vi })}`;
    };

    const allRatings = data?.pages.flatMap(page => page.ratings || []) || [];

    const likeMutation = useMutation({
        mutationFn: likeRating,
        onMutate: async ({ ratingId, userId }) => {
            await queryClient.cancelQueries({ queryKey: ['ratings', novelId] });
            const previousData = queryClient.getQueryData(['ratings', novelId]);

            queryClient.setQueryData(['ratings', novelId], (oldData: any) => {
                if (!oldData) return oldData;

                return {
                    ...oldData,
                    pages: oldData.pages.map((page: any) => ({
                        ...page,
                        ratings: page.ratings?.map((rating: any) => {
                            if (rating._id !== ratingId) return rating;

                            const isLiked = rating.likes.userIds.includes(userId);
                            const isDisliked = rating.dislikes.userIds.includes(userId);

                            if (isLiked) {
                                return {
                                    ...rating,
                                    likes: {
                                        count: rating.likes.count - 1,
                                        userIds: rating.likes.userIds.filter((id: string) => id !== userId)
                                    }
                                };
                            } else {
                                return {
                                    ...rating,
                                    likes: {
                                        count: rating.likes.count + 1,
                                        userIds: [...rating.likes.userIds, userId]
                                    },
                                    dislikes: isDisliked ? {
                                        count: rating.dislikes.count - 1,
                                        userIds: rating.dislikes.userIds.filter((id: string) => id !== userId)
                                    } : rating.dislikes
                                };
                            }
                        }) || []
                    }))
                };
            });

            return { previousData };
        },
        onSuccess: (res: any) => {
            const newRating = res.ratting;

            queryClient.setQueryData(['ratings', novelId], (oldData: any) => {
                if (!oldData) return oldData;

                return {
                    ...oldData,
                    pages: oldData.pages.map((page: any) => ({
                        ...page,
                        ratings: page.ratings?.map((rating: any) =>
                            rating._id === newRating._id ? { ...rating, dislikes: newRating.dislikes, likes: newRating.likes } : rating
                        ) || []
                    }))
                };
            });
        },
        onError: (error, _variables, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(['ratings', novelId], context.previousData);
            }

            console.log(error);

            notifyError('Lỗi khi thích đánh giá');
        }
    });

    const dislikeMutation = useMutation({
        mutationFn: dislikeRating,
        onMutate: async ({ ratingId, userId }) => {
            await queryClient.cancelQueries({ queryKey: ['ratings', novelId] });
            const previousData = queryClient.getQueryData(['ratings', novelId]);

            queryClient.setQueryData(['ratings', novelId], (oldData: any) => {
                if (!oldData) return oldData;

                return {
                    ...oldData,
                    pages: oldData.pages.map((page: any) => ({
                        ...page,
                        ratings: page.ratings?.map((rating: any) => {
                            if (rating._id !== ratingId) return rating;

                            const isLiked = rating.likes.userIds.includes(userId);
                            const isDisliked = rating.dislikes.userIds.includes(userId);

                            if (isDisliked) {
                                return {
                                    ...rating,
                                    dislikes: {
                                        count: rating.dislikes.count - 1,
                                        userIds: rating.dislikes.userIds.filter((id: string) => id !== userId)
                                    }
                                };
                            } else {
                                return {
                                    ...rating,
                                    dislikes: {
                                        count: rating.dislikes.count + 1,
                                        userIds: [...rating.dislikes.userIds, userId]
                                    },
                                    likes: isLiked ? {
                                        count: rating.likes.count - 1,
                                        userIds: rating.likes.userIds.filter((id: string) => id !== userId)
                                    } : rating.likes
                                };
                            }
                        }) || []
                    }))
                };
            });

            return { previousData };

        },
        onSuccess: (res: any) => {
            const newRating = res.ratting;
            console.log('newRatting', res.ratting);
            queryClient.setQueryData(['ratings', novelId], (oldData: any) => {
                if (!oldData) return oldData;

                return {
                    ...oldData,
                    pages: oldData.pages.map((page: any) => ({
                        ...page,
                        ratings: page.ratings?.map((rating: any) =>
                            rating._id === newRating._id ? { ...rating, likes: newRating.likes, dislikes: newRating.dislikes } : rating
                        ) || []
                    }))
                };
            });
        },
        onError: (error) => {
            console.log(error);
            notifyError('Lỗi khi không thích đánh giá');
        }
    });

    const handleLikeAcion = (ratingId: string) => {
        if (likeMutation.isPending) return;
        likeMutation.mutate({ ratingId, userId: currentUserId!, novelId });
    };

    const handleDislikeAction = (ratingId: string) => {
        if (dislikeMutation.isPending) return;
        dislikeMutation.mutate({ ratingId, userId: currentUserId!, novelId });
    };

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

    const router = useRouter();

    const onClickUsername = (_id: string) => {
        router.push(`/profile/${_id}`);
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="fixed bg-black/70 inset-0 z-50 flex items-center justify-center p-4"
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
                                <div className="flex justify-center items-center py-12">
                                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                </div>
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
                                                        src={(rating.userId.profile?.avatar?.publicId && avatars[rating.userId.profile.avatar.publicId]) || defaultFallback}
                                                        alt={rating.userId.username ?? 'Người dùng'}
                                                        width={40}
                                                        height={40}
                                                        className='rounded-full object-cover mt-1 flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10'
                                                    />
                                                    <div>
                                                        <p className="text-[1.1rem] font-bold text-blue-400 hover:cursor-pointer hover:text-blue-300"
                                                            onClick={() => onClickUsername(rating.userId._id)}
                                                        >
                                                            {rating.userId.username}
                                                        </p>
                                                        <span className="text-[0.9rem] text-gray-500">
                                                            {rating.createdAt ? getTimeAgo(rating.createdAt) : 'Gần đây'}
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

                                            <div className="flex justify-end items-center gap-3 mt-3">
                                                {/* Like Button */}
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => handleLikeAcion(rating._id)}
                                                    disabled={!currentUserId}
                                                    className={`flex min-w-[100px] hover:cursor-pointer justify-center items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 ${rating.likes.userIds.includes(currentUserId || '')
                                                        ? 'bg-blue-600 text-white border border-blue-500 shadow-lg shadow-blue-500/25'
                                                        : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-750 hover:border-blue-500 hover:text-blue-400'
                                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                                >
                                                    <ThumbsUp
                                                        size={16}
                                                        className={`mb-[0.21rem] ${rating.likes.userIds.includes(currentUserId || '') ? 'fill-white' : ''}`}
                                                    />
                                                    <span className="text-[0.9rem] font-medium">{rating.likes.count} like</span>
                                                </motion.button>

                                                {/* Dislike Button */}
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => handleDislikeAction(rating._id)}
                                                    disabled={!currentUserId}
                                                    className={`flex min-w-[100px] hover:cursor-pointer justify-center items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 ${rating.dislikes.userIds.includes(currentUserId || '')
                                                        ? 'bg-red-600 text-white border border-red-500 shadow-lg shadow-red-500/25'
                                                        : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-750 hover:border-red-500 hover:text-red-400'
                                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                                >
                                                    <ThumbsDown
                                                        size={16}
                                                        className={`mt-[0.21rem] ${rating.dislikes.userIds.includes(currentUserId || '') ? 'fill-white' : ''}`}
                                                    />
                                                    <span className="text-[0.9rem] font-medium">{rating.dislikes.count} dislike</span>
                                                </motion.button>
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