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
      },
      body: JSON.stringify(commentData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Lỗi khi tạo bình luận');
    }
    return await response.json();
    
  } catch (error) {
    console.error('Error creating comment:', error);
    throw error;
  }
};
