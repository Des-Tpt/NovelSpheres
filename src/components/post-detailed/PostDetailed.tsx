'use client'
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getPost } from '@/action/getPostById';

interface Post {
  _id: string;
  userId: { username: string; role: string; profile?: { avatar?: { publicId: string; format: string } } };
  novelId?: { title: string };
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
  const { data, isLoading, error } = useQuery<{ post: Post; comments: Comment[] }>({
    queryKey: ['post', id],
    queryFn: () => getPost(id as string),
  });

  if (isLoading) return <div className="text-center py-10">Loading...</div>;
  if (error) return <div className="text-center py-10 text-red-500">Error: {error.message.toString()}</div>;
  if (!data?.post) return <div className="text-center py-10">Post not found</div>;

  const { post, comments } = data;
  
  const getAvatarUrl = (publicId?: string) => {
    // Dùng link Cloudinary trực tiếp hoặc fallback
    return publicId && publicId.startsWith('http') 
      ? publicId 
      : 'https://res.cloudinary.com/dr29oyoqx/image/upload/LightNovel/BookCover/96776418_p0_qov0r8.png';
  };

  return (
    <div className="max-w-4xl mx-auto p-4 bg-white dark:bg-gray-900 min-h-screen">
      {/* Post Section */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6 pb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">{post.title}</h1>
        <div className="flex items-center gap-3">
          <Image
            src={getAvatarUrl(post.userId.profile?.avatar?.publicId)}
            alt={post.userId.username}
            width={40}
            height={40}
            className="rounded-full object-cover"
          />
          <div>
            <Link href={`/user/${post.userId.username}`} className="font-semibold text-gray-900 dark:text-white hover:underline">
              {post.userId.username}
            </Link>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {new Date(post.createdAt).toLocaleDateString()} • {post.views} views
            </p>
          </div>
        </div>
        {post.novelId && (
          <Link href={`/novel/${post.novelId.title}`} className="text-blue-500 hover:underline text-sm mt-2 block">
            {post.novelId.title}
          </Link>
        )}
        <p className="mt-4 text-gray-700 dark:text-gray-300 leading-relaxed">{post.content}</p>
      </div>

      {/* Comments Section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Comments ({comments.length})</h2>
        {comments.map((comment) => (
          <div key={comment._id} className="mb-6">
            <div className="flex gap-4">
              <Image
                src={getAvatarUrl(comment.userId.profile?.avatar?.publicId)}
                alt={comment.userId.username}
                width={36}
                height={36}
                className="rounded-full object-cover"
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
                            src={getAvatarUrl(reply.userId.profile?.avatar?.publicId)}
                            alt={reply.userId.username}
                            width={28}
                            height={28}
                            className="rounded-full object-cover"
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
  );
};

export default PostDetail;