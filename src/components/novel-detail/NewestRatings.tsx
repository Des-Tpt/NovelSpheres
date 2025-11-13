'use client'
import { getNewRatings } from "@/action/rateAction";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

interface RatingData {
    userId: {
        _id: string;
        username: string;
    },
    score: number;
    rate: string;
    createdAt?: string;
}


const NewestRatings = ({ novelId }: { novelId: string }) => {
    const { data } = useQuery<RatingData[]>({
        queryKey: ['ratingData', novelId],
        queryFn: () => getNewRatings(novelId),
    });

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    };

    const getTimeAgo = (date: string | undefined) => {
        if (!date) return 'Gần đây';
        const diffDays = Math.floor((new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
        return diffDays === 0 ? 'Hôm nay' : `${diffDays} ngày`;
    };

    const reviews = Array.isArray(data) ? data.slice(0, 3) : [];

    return (
        <motion.div className='w-full bg-gray-950 border border-blue-500 rounded-lg p-4'>
            <h3 className='text-white text-[1.3rem] font-semibold mb-4'>Đánh giá gần nhất</h3>

            <div className='space-y-2'>
                {reviews.map((review, index) => (
                    <motion.div
                        key={index}
                        variants={itemVariants}
                        initial='hidden'
                        animate='visible'
                        transition={{ delay: index * 0.1 }}
                        className='border border-blue-600 rounded p-3 hover:border-blue-400 transition-colors'
                    >
                        <div className='flex justify-between items-center mb-2'>
                            <p className='text-[1.1rem] font-bold text-blue-400'>{review.userId.username}</p>
                            <div className='flex gap-0.5'>
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={16} className={i < review.score ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'} />
                                ))}
                            </div>
                        </div>

                        <div className='flex justify-between items-start gap-2'>
                            <p className='text-[1.05rem] text-gray-300 line-clamp-2 flex-1'>{review.rate}</p>
                            <span className='text-[1rem] text-gray-500 whitespace-nowrap flex-shrink-0'>{getTimeAgo(review.createdAt)}</span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};

export default NewestRatings;