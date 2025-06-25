import mongoose from "mongoose";

export interface INovelWithPopulate extends Document {
    _id: mongoose.Types.ObjectId;
    title: string;
    authorId: {
        _id: mongoose.Types.ObjectId;
        username: string;
    };
    description: string;
    coverImage?: {
        publicId?: string;
        format?: string;
    };
    genresId: Array<{
        _id: mongoose.Types.ObjectId;
        name: string;
    }>;
    status: 'Ongoing' | 'Completed' | 'Hiatus';
    views: number;
    rating: number;
    createdAt: Date;
    updatedAt: Date;
    chapterCount :number;
    firstGenreName : string;
    authorName: string;
}

export default INovelWithPopulate;