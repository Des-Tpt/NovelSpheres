interface Comment {
    _id: string;
    userId: { _id: string; username: string; role: string; profile?: { avatar?: { publicId: string; format: string } } };
    content: string;
    replyToUserId?: { username: string; _id: string };
    replies: Comment[];
    createdAt: string;
}

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