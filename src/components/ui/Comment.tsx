import { motion } from "framer-motion";
import Image from "next/image";

interface Comment {
    _id: string;
    userId: { _id: string; username: string; role: string; profile?: { avatar?: { publicId: string; format: string } } };
    content: string;
    replyToUserId?: { username: string; _id: string };
    replies: Comment[];
    createdAt: string;
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

const renderComment = (comment: Comment, isReply: boolean = false) => {
    return (
      <motion.div
        key={comment._id}
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
              <div onClick={() => handleToProfile(comment.userId._id)} className="font-semibold cursor-pointer text-[1.15rem] text-white hover:text-blue-400 transition-colors">
                {comment.userId.username}
              </div>
              <span className="text-[0.85rem] px-2 bg-gray-900 border-white border text-gray-300 rounded-full">
                {handleRole(comment.userId.role)}
              </span>
            </div>
            <div className="text-gray-300 pb-1.5 mb-1.5 border-b">
              {comment.replyToUserId && (
                <span className="text-blue-400 font-medium" onClick={() => handleToProfile(comment.replyToUserId?._id!)}>@{comment.replyToUserId.username} </span>
              )}
              {comment.content}
            </div>
          <div className="flex items-center justify-between text-[1.05rem]">
            <div className='flex gap-4'>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1 text-gray-400 hover:text-blue-400 transition-colors"
                disabled={createCommentMutation.isPending}
              >
                <ThumbsUp className="w-4 h-4"/>
                  Thích
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleReply(comment._id, comment.userId.username, comment.userId._id)}
                className="flex items-center gap-1 text-gray-400 hover:text-blue-400 transition-colors"
                disabled={createCommentMutation.isPending}
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
        
        {/* Container nhập bình luận, chỉ hiện khi ấn vào trả lời */}
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
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder={`Trả lời @${replyToUser?.username}...`}
                  className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  disabled={createCommentMutation.isPending}
                />
                <div className="flex justify-end gap-2 mt-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCancelReply}
                    className="px-3 py-1 text-sm text-gray-400 hover:text-white transition-colors"
                    disabled={createCommentMutation.isPending}
                  >
                    Hủy
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSubmitReply(comment._id)}
                    className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
                    disabled={createCommentMutation.isPending || !replyContent.trim()}
                  >
                    {createCommentMutation.isPending ? (
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