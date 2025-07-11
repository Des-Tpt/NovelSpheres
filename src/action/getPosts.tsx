import { useQuery, keepPreviousData } from '@tanstack/react-query';

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
      if (!res.ok) throw new Error('Không thể lấy dữ liệu bài viết');
      return res.json();
    },
    staleTime: 1000 * 30 * 5,
  });
};
