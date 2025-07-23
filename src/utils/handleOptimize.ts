const optimizeComment = (comments: any[]) => { 
     const commentMap = new Map();
    const rootComments: any[] = [];

    //Tạo object replies rỗng cho comment.
    comments.forEach(comment => {
        commentMap.set(comment._id.toString(), { ...comment, replies: [] });
    });

    //Thêm các comment vào replies.
    comments.forEach(comment => {
        //Nếu parentId tồn tại
        if (comment.parentId) { //Tìm cha.
            const parent = commentMap.get(comment.parentId.toString());
            if (parent) { //Nếu cha không rỗng, push comment đang duyệt hiện tại vào mảng replies của cha.
                parent.replies.push(commentMap.get(comment._id.toString()));
            }
        } else {
            rootComments.push(commentMap.get(comment._id.toString()));
        }
    });

    return rootComments;
}

export default optimizeComment;