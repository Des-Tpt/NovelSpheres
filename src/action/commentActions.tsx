export const createComment = async (commentData: {
  sourceId: string;
  content: string;
  sourceType: 'ForumPost' | 'Novel' | 'NovelChapter';
  parentId?: string;
  replyToUserId?: string;
}) => {
  try {
    const response = await fetch('/api/comment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.PRIVATE_API_KEY!,
      },
      body: JSON.stringify(commentData),
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw Error(errorData.error || 'Lỗi khi bình luận!');
    }
    return await response.json();

  } catch (error) {
    throw error;
  }
};
