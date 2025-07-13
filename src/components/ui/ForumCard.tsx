import { BookOpenIcon, ChatBubbleLeftIcon, LightBulbIcon, PencilSquareIcon, QuestionMarkCircleIcon, StarIcon, UsersIcon } from "@heroicons/react/24/outline";
import { formatDistanceToNow } from "date-fns";
import { vi } from 'date-fns/locale';
import { Schema } from "mongoose";
import { PostType } from "@/model/PostForum";
import { random } from "lodash";

interface ForumPost {
    _id: Schema.Types.ObjectId;
    userId: Schema.Types.ObjectId;
    novelId?: Schema.Types.ObjectId;
    title: string;
    category: PostType;
    isLocked: boolean;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    views: number;
    owner: String,
    countPost: number,
};

type ForumCardProps = {
  data: ForumPost;
};

const ForumCard = ({ data }: ForumCardProps) => {
    const handleCategory = (category: String) => {
        switch(category) {
            case 'general' : return 'Thảo luận chung';
            case 'reviews' : return 'Đánh giá & Nhận xét'
            case 'ask-author' : return 'Hỏi đáp tác giả'
            case 'writing' : return 'Sáng tác & Viết lách'
            case 'recommendations' : return 'Gợi ý & Đề xuất'
            case 'support' : return 'Hỗ trợ & Trợ giúp'
        }
    }

    const getTimeAgo = (updatedAt: string | Date) => {
        // Kiểm tra xem updatedAt có tồn tại và hợp lệ không
        if (!updatedAt) return 'Không xác định';
        
        try {
            const date = new Date(updatedAt);
            // Kiểm tra xem date có hợp lệ không
            if (isNaN(date.getTime())) return 'Không xác định';
            
            return `${formatDistanceToNow(date, { addSuffix: true, locale: vi })}`;
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Không xác định';
        }
    }

    const handldeDiscription = (category: String) => {
        switch(category) {
            case 'general' : return 'Nơi thảo luận về mọi chủ đề liên quan đến tiểu thuyết';
            case 'reviews' : return 'Chia sẻ đánh giá về các tác phẩm đã đọc'
            case 'ask-author' : return 'Giao lưu trực tiếp với các tác giả'
            case 'writing' : return 'Hỗ trợ và thảo luận về việc viết truyện'
            case 'recommendations' : return 'Tìm kiếm và chia sẻ những tác phẩm hay'
            case 'support' : return 'Câu hỏi về website và tính năng'
        }
    }

    const handleIcon = (category: String) => {
    switch (category) {
        case 'general':
            return <ChatBubbleLeftIcon className="w-10 h-10 sm:w-12 sm:h-12 p-2 rounded-[0.8rem] text-blue-700 bg-gray-950 hover:bg-gray-800" />;
        case 'reviews':
            return <StarIcon className="w-10 h-10 sm:w-12 sm:h-12 p-2 rounded-[0.8rem] text-amber-600 bg-gray-950 hover:bg-gray-800" />;
        case 'ask-author':
            return <UsersIcon className="w-10 h-10 sm:w-12 sm:h-12 p-2 rounded-[0.8rem] text-purple-950 bg-gray-950 hover:bg-gray-800" />;
        case 'writing':
            return <BookOpenIcon className="w-10 h-10 sm:w-12 sm:h-12 p-2 rounded-[0.8rem] text-blue-600 bg-gray-950 hover:bg-gray-800" />;
        case 'recommendations':
            return <LightBulbIcon className="w-10 h-10 sm:w-12 sm:h-12 p-2 rounded-[0.8rem] text-green-600 bg-gray-950 hover:bg-gray-800" />;
        case 'support':
            return <QuestionMarkCircleIcon className="w-10 h-10 sm:w-12 sm:h-12 p-2 rounded-[0.8rem] text-red-600 bg-gray-950 hover:bg-gray-800" />;
        default:
            return null;
    }
    };

    // Kiểm tra xem data có đầy đủ thông tin cần thiết không
    if (!data || !data.category || !data.title) {
        return (
            <div className="border-gray-500 border bg-gray-950 rounded-[1rem] min-h-32 sm:min-h-40 h-auto py-4 sm:py-6 pr-2 w-auto flex items-center">
                <div className="flex justify-center w-full">
                    <div className="pl-3 sm:pl-5 pr-2 sm:pr-3 bg-gray-950 items-start">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 p-2 rounded-[0.8rem] bg-gray-800 animate-pulse"></div>
                    </div>
                    <div className="flex flex-col gap-1 pr-1.5 w-full">
                        <div className="h-4 bg-gray-800 rounded animate-pulse"></div>
                        <div className="h-3 bg-gray-800 rounded animate-pulse"></div>
                        <div className="h-3 bg-gray-800 rounded animate-pulse"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="border-gray-500 border bg-gray-950 rounded-[1rem] min-h-32 sm:min-h-40 h-auto py-4 sm:py-6 pr-2 w-auto flex items-center">
            <div className="flex justify-center w-full">
                <div className="pl-3 sm:pl-5 pr-2 sm:pr-3 bg-gray-950 items-start">
                    {handleIcon(data.category)}
                </div>
                <div className="flex flex-col gap-1 pr-1.5 w-full min-w-0">
                    <div className="flex relative justify-between items-center">
                        <span className="font-bold text-[0.95rem] sm:text-[1.1rem] line-clamp-1 pr-10 sm:pr-12 min-w-0">{handleCategory(data.category)}</span>
                        <span className="absolute rounded-[1.1rem] bg-gray-950 text-[0.7rem] sm:text-[0.8rem] font-bold px-2 sm:px-2.5 font-inter right-0.5 whitespace-nowrap">{data.countPost > 0? data.countPost : random(1, 100)}</span>
                    </div>
                    <span className="text-[0.75rem] sm:text-[0.85rem] font-inter line-clamp-1 sm:line-clamp-1 min-w-0">{handldeDiscription(data.category)}</span>
                    <div className="font-inter font-semibold min-w-0">
                        <span className="text-[0.8rem] line-clamp-2 sn:line-clamp-3 sm:text-[0.9rem] pr-2 block min-w-0 ">{data.title}</span>
                        <div className="flex text-[0.75rem] sm:text-[0.9rem] gap-1 sm:gap-2 items-center min-w-0">
                            <span className="truncate max-w-[35%] sm:max-w-[50%] min-w-0">{data.owner || 'Không xác định'}</span>
                            <span className="text-gray-400 flex-shrink-0">•</span>
                            <span className="truncate flex-1 min-w-0">{getTimeAgo(data.updatedAt)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ForumCard;