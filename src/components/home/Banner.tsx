'use client'
import { BoltIcon, BookOpenIcon, StarIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import Stat from "../ui/Stat";
import { motion } from "framer-motion";

const Banner = () => {
    return (
        <div className="flex flex-col items-center text-center bg-black px-2.5 md:bg-gradient-to-r md:from-black md:from-20% md:via-gray-950 md:via-75% md:to-black">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-full flex flex-col items-center"
            >
                <h1 className="text-5xl md:text-6xl px-3.5 pt-15 font-bold">Chào mừng đến với <span className="text-yellow-500">NovelSphere</span></h1>
                <p className="w-4xs py-5 md:w-2xl text-[1.25rem] font-inter md:py-4 md:px-6">Khám phá những câu chuyện hấp dẫn, đắm chìm trong những thế giới mới và tham gia vào cộng đồng những độc giả nhiệt huyết</p>
            </motion.div>
            <div className='grid grid-cols-2 py-2.5 gap-x-20 gap-y-5 md:grid md:grid-cols-4 md:gap-20'>
                <Stat
                    type={<UserGroupIcon className="w-8 h-8 ye text-yellow-600"/>}
                    stat="2.1M+"
                    text="Độc giả hoạt động"
                    delay={0}
                />
                <Stat
                    type={<BookOpenIcon className="w-10 h-8 ye text-yellow-600"/>}
                    stat="15K+"
                    text="Tiểu thuyết xuất bản"
                    delay={0.1}
                />
                <Stat
                    type={<BoltIcon className="w-8 h-8 ye text-yellow-600"/>}
                    stat="15K+"
                    text="Cập nhật mỗi ngày"
                    delay={0.2}
                />
                <Stat
                    type={<StarIcon className="w-8 h-8 ye text-yellow-600"/>}
                    stat="4.6"
                    text="Đánh giá trung bình"
                    delay={0.3}
                />
            </div>
        </div>
    );
}

export default Banner;
