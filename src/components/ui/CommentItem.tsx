'use client'
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { MessageCircle, ThumbsUp, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import handleRole from '@/utils/handleRole';

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
        return `Cập nhật ${formatDistanceToNow(new Date(updatedAt), { addSuffix: true, locale: vi })}`;
    };

    return (
        <motion.div
            variants={commentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`flex gap-4 pb-0.5 ${isReply ? 'ml-16 mt-3' : 'mb-3'}`}
        >
            <Image
                src={comment?.userId.profile?.avatar?.publicId && imageUrls[comment.userId.profile?.avatar?.publicId]
                    ? imageUrls[comment.userId.profile?.avatar?.publicId]
                    : `https://res.cloudinary.com/${cloudname}/image/upload/LightNovel/BookCover/96776418_p0_qov0r8.png`
                }
                alt={comment.userId.username}
                width={40}
                height={40}
                className='rounded-full object-cover mt-1 flex-shrink-0 w-10 h-10'
            />
            <div className="flex-1">
                <div className='rounded-[0.8rem] bg-gray-800 px-3 pt-2 pb-0.5'>
                    <div className="flex items-center gap-2 mb-1">
                        <div
                            onClick={() => onProfileClick(comment.userId._id)}
                            className="font-semibold cursor-pointer text-[1.15rem] text-white hover:text-blue-400 transition-colors"
                        >
                            {comment.userId.username}
                        </div>
                        <span className="text-[0.85rem] px-2 bg-gray-900 border-white border text-gray-300 rounded-full">
                            {handleRole(comment.userId.role)}
                        </span>
                    </div>
                    <div className="text-gray-300 pb-1.5 mb-1.5 border-b">
                        {comment.replyToUserId && (
                            <span
                                className="text-blue-400 font-medium cursor-pointer"
                                onClick={() => onProfileClick(comment.replyToUserId?._id!)}
                            >
                                @{comment.replyToUserId.username}{' '}
                            </span>
                        )}
                        {comment.content}
                    </div>
                    <div className="flex items-center justify-between text-[1.05rem]">
                        <div className='flex gap-4'>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="flex items-center gap-1 text-gray-400 hover:text-blue-400 transition-colors"
                                disabled={isSubmitting}
                            >
                                <ThumbsUp className="w-4 h-4" />
                                Thích
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => onReply(comment._id, comment.userId.username, comment.userId._id)}
                                className="flex items-center gap-1 text-gray-400 hover:text-blue-400 transition-colors"
                                disabled={isSubmitting}
                            >
                                <MessageCircle className="w-4 h-4" />
                                Trả lời
                            </motion.button>
                        </div>
                        <span className="text-[0.9rem] text-gray-400">
                            {getTimeAgo(comment.createdAt)}
                        </span>
                    </div>
                </div>

                {/* Reply input form */}
                <AnimatePresence>
                    {replyingTo === comment._id && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mt-3 p-3 bg-gray-800 rounded-lg border border-gray-700 overflow-hidden"
                        >
                            <textarea
                                value={replyContent}
                                onChange={(e) => onReplyContentChange(e.target.value)}
                                placeholder={`Trả lời @${replyToUser?.username}...`}
                                className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows={3}
                                disabled={isSubmitting}
                            />
                            <div className="flex justify-end gap-2 mt-2">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={onCancelReply}
                                    className="px-3 py-1 text-sm text-gray-400 hover:text-white transition-colors"
                                    disabled={isSubmitting}
                                >
                                    Hủy
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => onSubmitReply(comment._id)}
                                    className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
                                    disabled={isSubmitting || !replyContent.trim()}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                            Đang gửi...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-3 h-3" />
                                            Gửi
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