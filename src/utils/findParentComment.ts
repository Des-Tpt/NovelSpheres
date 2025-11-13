import { Comment } from "@/type/Comment";

const findParentComment = (targetCommentId: string, commentsList: Comment[]): string => {
    for (const comment of commentsList) {
        if (comment._id === targetCommentId) {
            return comment._id;
        }
        if (comment.replies && comment.replies.length > 0) {
            for (const reply of comment.replies) {
                if (reply._id === targetCommentId) {
                    return comment._id;
                }
            }
        }
    }
    return targetCommentId;
};

export default findParentComment;