export interface Post {
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
    novelId?: {
        _id: string;
        title: string;
    };
    title: string;
    content: string;
    category: string;
    views: number;
    createdAt: string;
}
