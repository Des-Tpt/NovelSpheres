'use client'
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { MessageCircle, ThumbsUp, Send, MoreHorizontal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import handleRole from '@/utils/handleRole';
import { useEffect, useState } from 'react';
import { getUserFromCookies } from '@/action/userAction';
import { toggleCommentLike } from '@/action/commentActions';

interface Comment {
    _id: string;
    userId: {
        _id: string;
        username: string;
        role: string;
        profile?: {
            avatar?: {
                publicId: string;
                format: string
            }
        }
    };
    content: string;
    replyToUserId?: { username: string; _id: string };
    replies: Comment[];
    createdAt: string;
    likes?: {
        count: number;
        userIds: string[];
    }
}

interface CommentItemProps {
    comment: Comment;
    isReply?: boolean;
    imageUrls: Record<string, string>;
    cloudname: string;
    replyingTo: string | null;
    replyContent: string;
    replyToUser: { id: string; username: string } | null;
    isSubmitting: boolean;
    onReply: (commentId: string, username: string, userId: string) => void;
    onReplyContentChange: (content: string) => void;
    onSubmitReply: (parentCommentId: string) => void;
    onCancelReply: () => void;
    onProfileClick: (userId: string) => void;
}

const commentVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.3 }
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        transition: { duration: 0.2 }
    }
};

const CommentItem: React.FC<CommentItemProps> = ({
    comment,
    isReply = false,
    imageUrls,
    cloudname,
    replyingTo,
    replyContent,
    replyToUser,
    isSubmitting,
    onReply,
    onReplyContentChange,
    onSubmitReply,
    onCancelReply,
    onProfileClick
}) => {
    const getTimeAgo = (updatedAt: string | Date) => {
        return `${formatDistanceToNow(new Date(updatedAt), { addSuffix: true, locale: vi })}`;
    };

    const [currentUser, setCurrentUser] = useState<any | null>(null);
    const [isLiking, setIsLiking] = useState(false);
    const [likeCount, setLikeCount] = useState(comment.likes?.count || 0);
    const [hasLiked, setHasLiked] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            const { user } = await getUserFromCookies();
            setCurrentUser(user);
            if (user && comment.likes?.userIds) {
                setHasLiked(comment.likes.userIds.includes(user._id));
            }
        };
        fetchUser();
    }, [comment._id]);

    const handleLikeClick = async () => {
        if (!currentUser || isLiking) return;

        setIsLiking(true);

        const previousHasLiked = hasLiked;
        const previousLikeCount = likeCount;

        setHasLiked(!hasLiked);
        setLikeCount(hasLiked ? likeCount - 1 : likeCount + 1);

        try {
            const result = await toggleCommentLike(comment._id);
            if (result.success) {
                setLikeCount(result.likes.count);
                setHasLiked(result.likes.hasLiked);
            }
        } catch (error) {
            console.error('Error liking comment:', error);
            setHasLiked(previousHasLiked);
            setLikeCount(previousLikeCount);
        } finally {
            setIsLiking(false);
        }
    };

    return (
        <motion.div
            variants={commentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`flex gap-2 sm:gap-4 pb-2 ${isReply ? 'ml-8 sm:ml-16 mt-2 sm:mt-3' : 'mb-3'}`}
        >
            <Image
                src={comment?.userId.profile?.avatar?.publicId && imageUrls[comment.userId.profile?.avatar?.publicId]
                    ? imageUrls[comment.userId.profile?.avatar?.publicId]
                    : `https://res.cloudinary.com/${cloudname}/image/upload/LightNovel/BookCover/96776418_p0_qov0r8.png`
                }
                alt={comment.userId.username}
                width={40}
                height={40}
                className='rounded-full object-cover mt-1 flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10'
            />
            <div className="flex-1 min-w-0">
                <div className='rounded-lg sm:rounded-[0.8rem] bg-gray-800 px-2 sm:px-3 pt-2 pb-1'>
                    <div className="flex items-center gap-1 sm:gap-2 mb-1">
                        <div
                            onClick={() => onProfileClick(comment.userId._id)}
                            className={`font-semibold cursor-pointer text-sm sm:text-[1.15rem] hover:text-blue-400 transition-colors truncate max-w-[120px] sm:max-w-none
                                ${currentUser && currentUser._id === comment.userId._id ? 'bg-gradient-to-r from-amber-400 to-orange-600 bg-clip-text text-transparent' : 'text-white'}    
                            `}
                        >
                            {comment.userId.username}
                        </div>
                        <span className="text-xs sm:text-[0.85rem] px-1.5 sm:px-2 py-0.5 bg-gray-900 border-white border text-gray-300 rounded-full whitespace-nowrap">
                            {handleRole(comment.userId.role)}
                        </span>
                    </div>
                    <div className="text-gray-300 text-sm sm:text-base pb-1.5 mb-1.5 border-b border-gray-600">
                        {comment.replyToUserId && (
                            <span
                                className="text-blue-400 font-medium cursor-pointer"
                                onClick={() => onProfileClick(comment.replyToUserId?._id!)}
                            >
                                @{comment.replyToUserId.username}{' '}
                            </span>
                        )}
                        <span className="break-words">{comment.content}</span>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className='flex gap-2 sm:gap-4'>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleLikeClick}
                                className={`flex items-center gap-1 transition-colors text-xs sm:text-sm ${hasLiked ? 'text-blue-400' : 'text-gray-400 hover:text-blue-400'
                                    }`}
                                disabled={isLiking || !currentUser}
                            >
                                <ThumbsUp className={`w-3 h-3 sm:w-4 sm:h-4 ${hasLiked ? 'fill-current' : ''}`} />
                                <span className='hidden sm:inline'>Thích</span>
                                {likeCount > 0 && <span className='text-sm ml-1'>({likeCount})</span>}
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => onReply(comment._id, comment.userId.username, comment.userId._id)}
                                className="flex items-center gap-1 text-gray-400 hover:text-blue-400 transition-colors text-xs sm:text-sm"
                                disabled={isSubmitting}
                            >
                                <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className='hidden sm:inline'>Trả lời</span>
                            </motion.button>
                        </div>

                        <span className="text-xs sm:text-sm text-gray-400 whitespace-nowrap">
                            {getTimeAgo(comment.createdAt)}
                        </span>
                    </div>
                </div>

                <AnimatePresence>
                    {replyingTo === comment._id && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mt-2 sm:mt-3 p-2 sm:p-3 bg-gray-800 rounded-lg border border-gray-700 overflow-hidden"
                        >
                            <textarea
                                value={replyContent}
                                onChange={(e) => onReplyContentChange(e.target.value)}
                                placeholder={`Trả lời @${replyToUser?.username}...`}
                                className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                                rows={2}
                                disabled={isSubmitting}
                                style={{
                                    minHeight: '60px'
                                }}
                            />
                            <div className="flex justify-end gap-2 mt-2">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={onCancelReply}
                                    className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
                                    disabled={isSubmitting}
                                >
                                    Hủy
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => onSubmitReply(comment._id)}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 min-w-[70px] justify-center"
                                    disabled={isSubmitting || !replyContent.trim()}
                                >
                                    {isSubmitting ? (
                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Send className="w-3 h-3" />
                                            <span className="hidden sm:inline ml-1">Gửi</span>
                                        </>
                                    )}
                                </motion.button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default CommentItem;