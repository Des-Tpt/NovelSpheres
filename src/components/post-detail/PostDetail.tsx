'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import LoadingPostComponent from '../ui/LoadingPost';
import { ArrowLeftIcon, Clock, EyeIcon, MessageCircle, ChevronDown, ChevronUp, Send, ThumbsUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getPostById } from '@/action/postActions';
import { createComment } from '@/action/commentActions';
import handleRole from '@/utils/handleRole';
import handlePostCategory from '@/utils/handleCategory';
import getImage from '@/action/imageActions';
import CommentItem from '../ui/CommentItem';
import findParentComment from '@/utils/findParentComment';
import { notifyError, notifySuccess } from '@/utils/notify';
import LoadingComponent from '../ui/Loading';
import { getUserFromCookies } from '@/action/userAction';
import { CurrentUser } from '@/type/CurrentUser';
import { Comment } from '@/type/Comment';
import { Post } from '@/type/Post';

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4 }
  }
};

const cloudname = process.env.NEXT_PUBLIC_CLOUDINARY_NAME! as string;

const PostDetail = () => {
  const router = useRouter();
  const { id } = useParams();
  const queryClient = useQueryClient();

  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [newCommentContent, setNewCommentContent] = useState('');
  const [replyToUser, setReplyToUser] = useState<{ id: string; username: string } | null>(null);
  const [showAllReplies, setShowAllReplies] = useState<Set<string>>(new Set());
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await getUserFromCookies();
        if (response?.user) setCurrentUser(response?.user);
      } catch (error) {
        setCurrentUser(null);
      }
    };
    fetchCurrentUser();
  }, []);


  const { data, isLoading, error } = useQuery<{ post: Post; comments: Comment[] }>({
    queryKey: ['post', id],
    queryFn: () => getPostById(id as string),
  });

  const createCommentMutation = useMutation({
    mutationFn: createComment,
    onSuccess: (response) => {
      const newComment = response.comment;
      queryClient.setQueryData(['post', id], (oldData: any) => {
        if (!oldData) return oldData;
        if (!newComment.parentId) {
          return {
            ...oldData,
            comments: [...oldData.comments, newComment],
          };
        }
        else {
          const updateComments = (comments: Comment[]): Comment[] => {
            return comments.map(comment => {
              if (comment._id === newComment.parentId) {
                return {
                  ...comment,
                  replies: [...(comment.replies || []), newComment]
                };
              }
              // Recursively check nested replies
              if (comment.replies?.length > 0) {
                return {
                  ...comment,
                  replies: updateComments(comment.replies)
                };
              }
              return comment;
            });
          };

          return {
            ...oldData,
            comments: updateComments(oldData.comments)
          };
        }
      });
      queryClient.invalidateQueries({ queryKey: ['forum-posts'] });
      notifySuccess('Bình luận đã được đăng thành công!');
    },
    onError: (error: Error) => {
      notifyError(error.message);
    }
  });

  const formatComment = (comments: Comment[]) => {
    return comments.map(comment => ({
      parent: comment,
      replies: (comment.replies || []).sort((a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
    }));
  };

  function countTotalComments(comments: Comment[]): number {
    let total = 0;
    for (const comment of comments) {
      total += 1;
      if (comment.replies && comment.replies.length > 0) {
        total += countTotalComments(comment.replies);
      }
    }
    return total;
  }

  const handleCategoryColor = (category: string) => {
    const baseClass =
      'inline-block px-2.5 py-1 md:px-3 md:py-1.5 my-2 text-xs md:text-sm rounded-lg md:rounded-[1rem] border font-semibold';

    switch (category) {
      case 'general':
        return <div className={`${baseClass} border-blue-500 text-blue-500`}>Thảo luận chung</div>;
      case 'reviews':
        return <div className={`${baseClass} border-yellow-600 text-amber-600`}>Đánh giá & Nhận xét</div>;
      case 'ask-author':
        return <div className={`${baseClass} border-purple-950 text-purple-950`}>Hỏi đáp tác giả</div>;
      case 'writing':
        return <div className={`${baseClass} border-blue-600 text-blue-600`}>Sáng tác & Viết lách</div>;
      case 'recommendations':
        return <div className={`${baseClass} border-green-600 text-green-600`}>Gợi ý & Đề xuất</div>;
      case 'support':
        return <div className={`${baseClass} border-red-600 text-red-600`}>Hỗ trợ & Trợ giúp</div>;
      default:
        return <div className={`${baseClass} border-gray-300`}>Khác</div>;
    }
  };

  useEffect(() => {
    if (!Array.isArray(data?.comments)) return;
    data.comments.map(async (comment) => {
      const publicId = comment.userId.profile?.avatar?.publicId ?? '';
      const format = comment.userId.profile?.avatar?.format ?? 'jpg';
      const res = await getImage(publicId, format);
      if (res) {
        setImageUrls((prev) => ({ ...prev, [publicId]: res }));
      }

      if (Array.isArray(comment.replies)) {
        comment.replies.map(async (reply) => {
          const replyPublicId = reply.userId.profile?.avatar?.publicId ?? '';
          const replyFormat = reply.userId.profile?.avatar?.format ?? 'jpg';
          const replyRes = await getImage(replyPublicId, replyFormat);
          if (replyRes) {
            setImageUrls((prev) => ({ ...prev, [replyPublicId]: replyRes }));
          }
        });
      }
    });
  }, [data]);

  const toggleShowAllReplies = (commentId: string) => {
    const newShowAll = new Set(showAllReplies);
    if (newShowAll.has(commentId)) {
      newShowAll.delete(commentId);
    } else {
      newShowAll.add(commentId);
    }
    setShowAllReplies(newShowAll);
  };

  const handleReply = (commentId: string, username: string, userId: string) => {
    setReplyingTo(commentId);
    setReplyToUser({ id: userId, username });
    setReplyContent('');
  };

  const handleSubmitReply = async (parentCommentId: string) => {
    if (!replyContent.trim() || !replyToUser) return;

    try {
      const parentId = findParentComment(parentCommentId, comments);

      await createCommentMutation.mutateAsync({
        sourceId: id as string,
        content: replyContent,
        sourceType: 'ForumPost',
        parentId: parentId,
        replyToUserId: replyToUser.id
      });

      setReplyingTo(null);
      setReplyContent('');
      setReplyToUser(null);
    } catch (error) {
      console.error('Lỗi khi trả lời bình luận:', error);
    }
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setReplyContent('');
    setReplyToUser(null);
  };

  const handleToProfile = (_id: string) => {
    router.push(`/profile/${_id}`);
  }

  const handleSubmitComment = async () => {
    if (!newCommentContent.trim()) {
      return
    }

    try {
      await createCommentMutation.mutateAsync({
        sourceId: id as string,
        content: newCommentContent,
        sourceType: 'ForumPost'
      });

      setNewCommentContent('');
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  };

  const renderComment = (comment: Comment, isReply: boolean = false) => {
    return (
      <CommentItem
        key={comment._id}
        comment={comment}
        isReply={isReply}
        imageUrls={imageUrls}
        cloudname={cloudname}
        replyingTo={replyingTo}
        replyContent={replyContent}
        replyToUser={replyToUser}
        isSubmitting={createCommentMutation.isPending}
        onReply={handleReply}
        onReplyContentChange={setReplyContent}
        onSubmitReply={handleSubmitReply}
        onCancelReply={handleCancelReply}
        onProfileClick={handleToProfile}
        currentUser={currentUser}
      />
    )
  };

  useEffect(() => {
    if (!data?.post?.userId.profile?.avatar?.publicId || !data?.post?.userId.profile?.avatar?.format) return;

    const fetchImage = async () => {
      try {
        const url = await getImage(data.post.userId.profile!.avatar!.publicId, data.post.userId.profile!.avatar!.format);
        setAvatarUrl(url);
      } catch (error) {
        console.error('Error fetching avatar:', error);
      }
    };

    fetchImage();
  }, [data?.post?.userId.profile?.avatar?.publicId, data?.post?.userId.profile?.avatar?.format]);

  if (isLoading) return <LoadingComponent />;
  if (error) return <div className="text-center py-10 text-red-500">Error: {error.message.toString()}</div>;
  if (!data?.post) return <div className="text-center py-10">Post not found</div>;

  const { post, comments } = data;
  const organizedComments = formatComment(comments);

  const handlePushNovel = (novelId?: string) => {
    router.push(`/novels/${novelId}`)
  }

  return (
    <div>
      <motion.div
        className=''
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <title>{post.title}</title>
        <div className="p-3 md:p-4 min-h-screen">
          {/* Breadcrumb - Mobile optimized */}
          <motion.div
            className='flex font-inter text-xs md:text-sm py-2 md:py-3 overflow-x-auto scrollbar-hide'
            variants={itemVariants}
          >
            <a href='/forum' className='pr-2 flex items-center whitespace-nowrap'>
              <ArrowLeftIcon className='w-3 h-3 md:w-3.5 md:h-3.5' />
              <span className='pl-1'>Diễn đàn</span>
            </a> /
            <a href={`/forum?category=${post.category}`} className='pl-2 pr-2 whitespace-nowrap truncate max-w-[120px] md:max-w-none'>{handlePostCategory(post.category)}</a> /
            <a href='#' className='pl-2 pr-2 whitespace-nowrap'>Bài viết</a>
          </motion.div>

          {/* Post Header - Mobile optimized */}
          <motion.div
            className='bg-gray-950 px-3 md:px-5 py-3 md:py-2.5 border border-gray-600 rounded-lg md:rounded-[0.8rem]'
            variants={itemVariants}
          >
            <div>{handleCategoryColor(post.category)}</div>
            <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white py-1 leading-tight">{post.title}</h1>

            {post.novelId && (
              <div className='pb-3 md:pb-4'>
                <div onClick={() => handlePushNovel(post.novelId?._id)} className="font-inter text-sm md:text-[0.95rem] pl-0.5 mt-2 block">
                  Liên quan đến: <span className='text-yellow-500 hover:underline break-words'>{post.novelId.title}</span>
                </div>
              </div>
            )}

            {/* Author info - Mobile optimized */}
            <div className="flex items-start md:items-center gap-3">
              <Image
                src={avatarUrl || `https://res.cloudinary.com/${cloudname}/image/upload/LightNovel/BookCover/96776418_p0_qov0r8.png`}
                width={200}
                height={280}
                alt={post.title}
                className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl object-cover object-top transition-transform duration-200 hover:scale-105 flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div onClick={() => handleToProfile(post.userId._id)} className="font-semibold text-gray-900 text-base md:text-[1.3rem] dark:text-white hover:text-blue-500">
                  <div className='flex gap-3 items-center cursor-pointer'>
                    <span className="truncate">{post.userId.username}</span>
                    <span className='block px-2 md:px-2.5 font-inter text-[0.65rem] md:text-[0.75rem] font-bold border border-gray-600 rounded-xl md:rounded-2xl md:mt-0.5'>
                      {handleRole(post.userId.role)}
                    </span>
                  </div>
                </div>
                <div className='flex font-inter gap-2.5'>
                  <div className='flex items-center gap-1 text-xs md:text-sm text-gray-300'>
                    <Clock className='w-3 h-3 md:w-4 md:h-4 flex-shrink-0' />
                    <span className="truncate">
                      {new Date(post.createdAt).toLocaleString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                      })}
                    </span>
                  </div>
                  <span className="inline">•</span>
                  <div className='flex items-center gap-1 text-xs md:text-sm text-gray-300'>
                    <EyeIcon className='w-3 h-3 md:w-4 md:h-4 flex-shrink-0' />
                    <span>{post.views} lượt xem</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Post Content - Mobile optimized */}
          <motion.div
            className='bg-gray-950 px-3 md:px-5 py-3 md:py-1.5 mt-2.5 border border-gray-600 rounded-lg md:rounded-[0.8rem]'
            variants={itemVariants}
          >
            <div className="prose prose-sm md:prose prose-invert my-3 md:my-4 text-gray-700 dark:text-gray-300 max-w-none"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </motion.div>

          {/* Comments Section - Mobile optimized */}
          <motion.div
            className="mt-6 md:mt-8 bg-gray-950 px-3 md:px-5 py-4 border border-gray-600 rounded-lg md:rounded-[0.8rem]"
            variants={itemVariants}
          >
            <h2 className="text-lg md:text-xl font-semibold text-white mb-4 md:mb-6 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 md:w-5 md:h-5" />
              Bình luận ({countTotalComments(comments)})
            </h2>

            {/* New Comment Form - Mobile optimized */}
            <motion.div
              className="mb-4 md:mb-6 rounded-lg"
              variants={itemVariants}
            >
              <textarea
                value={newCommentContent}
                onChange={(e) => setNewCommentContent(e.target.value)}
                placeholder="Viết bình luận của bạn..."
                className="w-full p-3 bg-gray-900 border border-gray-600 rounded-md text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                rows={3}
                disabled={createCommentMutation.isPending}
              />
              <div className="flex justify-end mt-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSubmitComment}
                  className="flex items-center gap-2 px-3 md:px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm md:text-base"
                  disabled={createCommentMutation.isPending || !newCommentContent.trim()}
                >
                  {createCommentMutation.isPending ? (
                    <>
                      <div className="w-3 h-3 md:w-4 md:h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span className="hidden md:inline">Đang đăng...</span>
                      <span className="md:hidden">Đăng...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3 h-3 md:w-4 md:h-4" />
                      <span className="hidden md:inline">Đăng bình luận</span>
                      <span className="md:hidden">Đăng</span>
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>

            {/* Comments List */}
            <div className="space-y-3 md:space-y-4 border-t-[1px] border-white pt-6 md:pt-10 pb-6 md:pb-10">
              {comments.length === 0 ? (
                <motion.div
                  className="text-center py-6 md:py-8 text-gray-400"
                  variants={itemVariants}
                >
                  <MessageCircle className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm md:text-base">Chưa có bình luận nào. Hãy là người đầu tiên bình luận!</p>
                </motion.div>
              ) : (
                <AnimatePresence>
                  {organizedComments.map(({ parent, replies }) => (
                    <div key={parent._id}>
                      {renderComment(parent, false)}

                      {replies.length > 0 && (
                        <div className="space-y-0">
                          {(showAllReplies.has(parent._id) ? replies : replies.slice(0, 2)).map((reply) =>
                            renderComment(reply, true)
                          )}

                          {replies.length > 2 && (
                            <motion.div
                              className="ml-8 md:ml-12 mt-2"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.3 }}
                            >
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => toggleShowAllReplies(parent._id)}
                                className="flex cursor-pointer items-center gap-2 px-2 md:px-3 py-1.5 text-xs md:text-sm text-blue-400 hover:text-blue-300 transition-colors rounded-md hover:bg-gray-800/50"
                              >
                                {showAllReplies.has(parent._id) ? (
                                  <>
                                    <ChevronUp className="w-3 h-3 md:w-4 md:h-4" />
                                    <span className="hidden md:inline">Ẩn bớt phản hồi</span>
                                    <span className="md:hidden">Ẩn bớt</span>
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-3 h-3 md:w-4 md:h-4" />
                                    <span className="hidden md:inline">Hiển thị {replies.length - 2} phản hồi khác</span>
                                    <span className="md:hidden">Hiện {replies.length - 2} khác</span>
                                  </>
                                )}
                              </motion.button>
                            </motion.div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default PostDetail;