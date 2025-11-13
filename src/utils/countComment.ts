import { Comment } from "@/type/Comment";

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

export default countTotalComments;