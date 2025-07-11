'use client'
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getPost } from '@/action/getPostById';
import LoadingPostComponent from '../ui/LoadingPost';
import ReactMarkdown from 'react-markdown';
import { ArrowLeftIcon, Clock, EyeIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import getImage from '@/action/getImage';

interface Post {
  _id: string;
  userId: { username: string; role: string; profile?: { avatar?: { publicId: string; format: string } } };
  novelId?: { 
    title: string 
  };
  title: string;
  content: string;
  category: string;
  views: number;
  createdAt: string;
}

interface Comment {
  _id: string;
  userId: { username: string; role: string; profile?: { avatar?: { publicId: string; format: string } } };
  content: string;
  replyToUserId?: { username: string };
  replies: Comment[];
  createdAt: string;
}

const PostDetail = () => {
  const { id } = useParams();
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const { data, isLoading, error } = useQuery<{ post: Post; comments: Comment[] }>({
    queryKey: ['post', id],
    queryFn: () => getPost(id as string),
  });

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
  const handleCategory = (category: String) => {
      switch(category) {
            case 'general' : return 'Thảo luận chung';
            case 'reviews' : return 'Đánh giá & Nhận xét'
            case 'ask-author' : return 'Hỏi đáp tác giả'
            case 'writing' : return 'Sáng tác & Viết lách'
            case 'recommendations' : return 'Gợi ý & Đề xuất'
            case 'support' : return 'Hỗ trợ & Trợ giúp'
        }
  }
  const handleRole = (role: String) => {
        switch(role) {
            case 'admin' : return 'Quản trị viên';
            case 'Writer' : return 'Tác gia'
            case 'reader' : return 'Độc giả'
        }
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


  if (isLoading) return (<div className='px-[14%]'><LoadingPostComponent /></div>);
  if (error) return <div className="text-center py-10 text-red-500">Error: {error.message.toString()}</div>;
  if (!data?.post) return <div className="text-center py-10">Post not found</div>;

  const { post, comments } = data;

  const content = post.content.replace(/\\n/g, '\n');

  const getAvatarUrl = (publicId?: string, format?: string) => {
    return publicId && publicId.startsWith('http') 
      ? publicId 
      : 'https://res.cloudinary.com/dr29oyoqx/image/upload/LightNovel/BookCover/96776418_p0_qov0r8.png';
  };

  return (
  <div className='px[14%]'>
    <div className="max-w-[60%] mx-auto p-4 min-h-screen">
      <div className='flex font-inter text-[0.92rem] py-3'>
        <a href='/forum' className='pr-2 flex items-center'><ArrowLeftIcon className='w-3.5 h-3.5' /><span className='pl-1'>Diễn đàn</span></a> / 
        <a href={`/forum?category=${post.category}`} className='pl-2 pr-2'>{handleCategory(post.category)}</a> / 
        <a href='#' className='pl-2 pr-2'>Bài viết</a>
      </div>
      {/* Post Section */}
      <div className='bg-gray-900 px-5 py-2.5 border border-gray-600 rounded-[0.8rem]'>
        <div>{handleCategoryColor(post.category)}</div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white py-1">{post.title}</h1>
        {post.novelId && (
          <div className='pb-4'>
            <Link href={`/novel/${post.novelId.title}`} className="font-inter text-[0.95rem] pl-0.5 mt-2 block">
              Liên quan đến: <span className='text-amber-600 hover:underline'>{post.novelId.title}</span>
            </Link>
          </div>
        )}
        <div className="flex items-center gap-3">
          <Image
            src={getAvatarUrl(post.userId.profile?.avatar?.publicId, post.userId.profile?.avatar?.format)}
            alt={post.userId.username}
            width={80}
            height={80}
            className="rounded-full w-15 h-15 object-cover"
          />
          <div>
            <Link href={`/user/${post.userId.username}`} className="font-semibold text-gray-900 text-[1.3rem] dark:text-white hover:text-blue-500">
              <div className='flex items-center'>
                <span>{post.userId.username}</span>
                <span className='ml-3 px-2.5 font-inter text-[0.75rem] font-bold border border-gray-600 rounded-2xl mt-0.5'>{handleRole(post.userId.role)}</span>
              </div>
            </Link>
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
      </div>
     <div className='bg-gray-900 px-5 py-1.5 mt-2.5 border border-gray-600 rounded-[0.8rem]'>
        <div className="mt-4 text-gray-700 dark:text-gray-300 leading-relaxed">
          <ReactMarkdown>
            {content}
          </ReactMarkdown>
        </div>
      </div>

      {/* Comments Section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Comments ({countTotalComments(comments)})</h2>
        {comments.map((comment) => (
          <div key={comment._id} className="mb-6">
            <div className="flex gap-4">
              <Image
                src={getAvatarUrl(comment.userId.profile?.avatar?.publicId, comment.userId.profile?.avatar?.format)}
                alt={comment.userId.username}
                width={80}
                height={80}
                className="rounded-full w-10 h-10 object-cover mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Link href={`/user/${comment.userId.username}`} className="font-semibold text-gray-900 dark:text-white hover:underline">
                    {comment.userId.username}
                  </Link>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <p className="text-gray-700 dark:text-gray-300">
                  {comment.replyToUserId && (
                    <span className="text-blue-500 font-medium">@{comment.replyToUserId.username} </span>
                  )}
                  {comment.content}
                </p>
                {comment.replies.length > 0 && (
                  <div className="ml-8 mt-3 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                    {comment.replies.map((reply) => (
                      <div key={reply._id} className="mb-3">
                        <div className="flex gap-3">
                          <Image
                            src={getAvatarUrl(reply.userId.profile?.avatar?.publicId, reply.userId.profile?.avatar?.format)}
                            alt={reply.userId.username}
                            width={80}
                            height={80}
                            className="rounded-full w-10 h-10 mt-1 object-cover"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <Link href={`/user/${reply.userId.username}`} className="font-semibold text-gray-900 dark:text-white hover:underline">
                                {reply.userId.username}
                              </Link>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {new Date(reply.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300">
                              {reply.replyToUserId && (
                                <span className="text-blue-500 font-medium">@{reply.replyToUserId.username} </span>
                              )}
                              {reply.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
    </div>
  );
};

export default PostDetail;