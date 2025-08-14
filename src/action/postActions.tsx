import { notifyError } from '@/utils/notify';
import { useQuery } from '@tanstack/react-query';

interface ForumPost {
  _id: string;
  userId: string;
  title: string;
  content: string;
  views: number;
  category: string;
  createdAt: string;
  updatedAt: string;
  owner: string;
  isLocked: boolean;
  avatar?: {
    publicId: string;
    format: string;
  };
  totalRepiles: number;
  role: string;
  lastCommentAt: Date;
}

interface ForumPostResponse {
  data: ForumPost[];
  page: number;
  total: number;
  hasMore: boolean;
}

export const useForumPosts = ({ page = 1, category = '', sort = 'date', limit = 10 }: { page?: number; category?: string; sort?: string; limit: number; }) => {
  return useQuery<ForumPostResponse>({
    queryKey: ['forum-posts', category, sort, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        ...(category && { category }),
        ...(sort && { sort }),
        ...(limit && { limit: String(limit) })
      });

      const res = await fetch(`/api/forum/posts?${params.toString()}`);
      if (!res.ok) throw Error('Không thể lấy dữ liệu bài viết');
      return res.json();
    },
    staleTime: 1000 * 30 * 5,
    refetchOnWindowFocus: true,
  });
};

export const getHeaderForum = async () => {
  const res = await fetch(`/api/forum/header-forum`);
  if (!res.ok) throw Error('Lỗi khi fetch dữ liệu');
  return res.json();
}

export async function getPostById(id: string) {
  const res = await fetch(`/api/forum/posts/${id}`);

  if (!res.ok) {
    throw Error(`Không thể lấy post!`);
  }

  const data = await res.json();
  return data;
}

export const createPost = async (postData: {
  novelId?: string;
  title: string;
  category: 'general' | 'reviews' | 'recommendations' | 'ask-author' | 'writing' | 'support';
  content: string;
}) => {
  const response = await fetch('/api/forum/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(postData),
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw Error(errorData.error || 'Lỗi khi đăng bài!');
  }

  return await response.json();
};
