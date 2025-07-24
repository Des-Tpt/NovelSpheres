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
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import handleRole from '@/utils/handleRole';
import handlePostCategory from '@/utils/handleCategory';
import getImage from '@/action/imageActions';
import { Popup } from '../ui/Popup';


interface Post {
  _id: string;
  userId: { 
    _id:string; 
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
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  
  const { data, isLoading, error } = useQuery<{ post: Post; comments: Comment[] }>({
    queryKey: ['post', id],
    queryFn: () => getPostById(id as string),
  });

  const createCommentMutation = useMutation({
    mutationFn: createComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post', id] });
      setSuccessNotice('Bình luận đã được đăng thành công!');
    },
    onError: (error: Error) => {
      setErrorNotice(error.message);
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

  useEffect(() => {
    if (errorNotice) {
        const timeout = setTimeout(() => setErrorNotice(''), 2000); 
        return () => clearTimeout(timeout);
    }
  }, [errorNotice]);

  useEffect(() => {
    if (successNotice) {
        const timeout = setTimeout(() => setSuccessNotice(''), 2000);
        return () => clearTimeout(timeout);
    }
  }, [successNotice]);

  const getTimeAgo = (updatedAt: string | Date) => {
    return `Cập nhật ${formatDistanceToNow(new Date(updatedAt), { addSuffix: true,  locale: vi })}`;
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
          const format = comment.userId.profile?.avatar?.format?? 'jpg';
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

  const findParentComment = (parentCommentId: string, commentsList: Comment[]): string => {
    commentsList.map(comment => {
      if (comment._id === parentCommentId) {
        return comment._id;
      }
      if (comment.replies && comment.replies.length > 0) {
        comment.replies.map(reply => {
          if (reply._id === parentCommentId) {
            return comment._id;
          }
        });
      }
    });
    return parentCommentId; // Nếu không tìm thấy, trả về ID gốc
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
      console.error('Error submitting reply:', error);
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
    if (!newCommentContent.trim()) return;
    
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
    <motion.div 
      className=''
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
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
      <AnimatePresence>
        {successNotice && (
          <Popup
            message={successNotice}
            type="success"
            onClose={() => setSuccessNotice(null)}
          />
        )}
        {errorNotice && (
          <Popup
            message={errorNotice}
            type="error"
            onClose={() => setErrorNotice(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PostDetail;