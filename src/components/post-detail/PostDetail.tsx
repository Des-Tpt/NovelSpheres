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


interface Post {
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
  novelId?: {
    _id: string;
    title: string;
  };
  title: string;
  content: string;
  category: string;
  views: number;
  createdAt: string;
}

interface Comment {
  _id: string;
  userId: { _id: string; username: string; role: string; profile?: { avatar?: { publicId: string; format: string } } };
  content: string;
  replyToUserId?: { username: string; _id: string };
  replies: Comment[];
  createdAt: string;
}

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

  const { data, isLoading, error } = useQuery<{ post: Post; comments: Comment[] }>({
    queryKey: ['post', id],
    queryFn: () => getPostById(id as string),
  });

  const createCommentMutation = useMutation({
    mutationFn: createComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post', id] });
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
      'inline-block px-3 my-2 text-[1rem] rounded-[1rem] border font-semibold';

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
    if (!newCommentContent.trim()) 
    {
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

  if (isLoading) return (<div><LoadingPostComponent /></div>);
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
        <div className="mx-auto p-4 min-h-screen">
          <motion.div
            className='flex font-inter text-[0.92rem] py-3'
            variants={itemVariants}
          >
            <a href='/forum' className='pr-2 flex items-center'><ArrowLeftIcon className='w-3.5 h-3.5' /><span className='pl-1'>Diễn đàn</span></a> /
            <a href={`/forum?category=${post.category}`} className='pl-2 pr-2'>{handlePostCategory(post.category)}</a> /
            <a href='#' className='pl-2 pr-2'>Bài viết</a>
          </motion.div>

          <motion.div
            className='bg-gray-950 px-5 py-2.5 border border-gray-600 rounded-[0.8rem]'
            variants={itemVariants}
          >
            <div>{handleCategoryColor(post.category)}</div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white py-1">{post.title}</h1>
            {post.novelId && (
              <div className='pb-4'>
                <div onClick={() => handlePushNovel(post.novelId?._id)} className="font-inter text-[0.95rem] pl-0.5 mt-2 block">
                  Liên quan đến: <span className='text-yellow-500 hover:underline'>{post.novelId.title}</span>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Image
                src={avatarUrl || `https://res.cloudinary.com/${cloudname}/image/upload/LightNovel/BookCover/96776418_p0_qov0r8.png`}
                width={200}
                height={280}
                alt={post.title}
                className="post-image w-12 h-12 md:w-15 md:h-15 rounded-2xl md:rounded-4xl object-cover object-top transition-transform duration-200 hover:scale-105"
              />
              <div>
                <div onClick={() => handleToProfile(post.userId._id)} className="font-semibold text-gray-900 text-[1.3rem] dark:text-white hover:text-blue-500">
                  <div className='flex items-center cursor-pointer'>
                    <span>{post.userId.username}</span>
                    <span className='ml-3 px-2.5 font-inter text-[0.75rem] font-bold border border-gray-600 rounded-2xl mt-0.5'>{handleRole(post.userId.role)}</span>
                  </div>
                </div>
                <div className='flex gap-3 font-inter'>
                  <div className='flex items-center gap-1 text-sm text-gray-300'>
                    <Clock className='w-4 h-4' />
                    <span>
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
                  •
                  <div className='flex items-center gap-1 text-sm text-gray-300'>
                    <EyeIcon className='w-4 h-4' />
                    <span>{post.views} lượt xem</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            className='bg-gray-950 px-5 py-1.5 mt-2.5 border border-gray-600 rounded-[0.8rem]'
            variants={itemVariants}
          >
            <div className="prose prose-invert my-4 text-gray-700 dark:text-gray-300"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </motion.div>

          <motion.div
            className="mt-8 bg-gray-950 px-5 py-4 border border-gray-600 rounded-[0.8rem]"
            variants={itemVariants}
          >
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Bình luận ({countTotalComments(comments)})
            </h2>

            <motion.div
              className="mb-6 rounded-lg"
              variants={itemVariants}
            >
              <textarea
                value={newCommentContent}
                onChange={(e) => setNewCommentContent(e.target.value)}
                placeholder="Viết bình luận của bạn..."
                className="w-full p-3 bg-gray-900 border border-gray-600 rounded-md text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                disabled={createCommentMutation.isPending}
              />
              <div className="flex justify-end mt-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSubmitComment}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={createCommentMutation.isPending || !newCommentContent.trim()}
                >
                  {createCommentMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Đang đăng...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Đăng bình luận
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>

            <div className="space-y-4 border-t-[1px] border-white pt-10 pb-10">
              {comments.length === 0 ? (
                <motion.div
                  className="text-center py-8 text-gray-400"
                  variants={itemVariants}
                >
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Chưa có bình luận nào. Hãy là người đầu tiên bình luận!</p>
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
                              className="ml-12 mt-2"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.3 }}
                            >
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => toggleShowAllReplies(parent._id)}
                                className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors rounded-md hover:bg-gray-800/50"
                              >
                                {showAllReplies.has(parent._id) ? (
                                  <>
                                    <ChevronUp className="w-4 h-4" />
                                    Ẩn bớt phản hồi
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-4 h-4" />
                                    Hiển thị {replies.length - 2} phản hồi khác
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