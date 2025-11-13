export interface Comment {
    _id: string;
    userId: {
        _id: string;
        username: string;
        role: string;
        profile?: {
            avatar?: {
                publicId: string;
                format: string
            }
        }
    };
    content: string;
    replyToUserId?: {
        username: string;
        _id: string
    };
    replies: Comment[];
    createdAt: string;
    likes?: {
        count: number;
        userIds: string[];
    }
}