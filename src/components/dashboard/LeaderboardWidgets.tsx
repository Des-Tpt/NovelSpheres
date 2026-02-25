'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Eye, Flame, Clock, ShieldCheck, PenTool, User as UserIcon } from 'lucide-react';
import CustomImage from '../ui/CustomImage';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface NovelData {
    _id: string;
    title: string;
    views?: number;
    rating?: number;
    ratingsCount?: number;
    likes?: number;
    authorId: { username: string };
}

interface UserData {
    _id: string;
    username: string;
    email: string;
    role: string;
    createdAt: string;
    profile?: { avatar?: { publicId: string, format: string } };
}

interface LeaderboardWidgetsProps {
    topViewed: NovelData[];
    topRated: NovelData[];
    mostActive: NovelData[];
    newestUsers: UserData[];
}

const cloudname = process.env.NEXT_PUBLIC_CLOUDINARY_NAME! as string;
const defaultFallback = `https://res.cloudinary.com/${cloudname}/image/upload/LightNovel/BookCover/96776418_p0_qov0r8.png`;

export default function LeaderboardWidgets({ topViewed, topRated, mostActive, newestUsers }: LeaderboardWidgetsProps) {
    const [activeTab, setActiveTab] = useState<'views' | 'rating'>('views');

    const formatNumber = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'admin': return <ShieldCheck className="w-3 h-3 text-red-400" />;
            case 'writer': return <PenTool className="w-3 h-3 text-green-400" />;
            default: return <UserIcon className="w-3 h-3 text-blue-400" />;
        }
    };

    const displayNovels = activeTab === 'views' ? topViewed : topRated;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-6 flex flex-col"
            >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
                            <Trophy className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 leading-none">Bảng xếp hạng</h3>
                            <p className="text-sm text-gray-500 mt-1">Các tác phẩm có hiệu suất tốt nhất</p>
                        </div>
                    </div>

                    <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-200">
                        <button
                            onClick={() => setActiveTab('views')}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'views' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-900 hover:bg-white'
                                }`}
                        >
                            Lượt xem
                        </button>
                        <button
                            onClick={() => setActiveTab('rating')}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'rating' ? 'bg-amber-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-900 hover:bg-white'
                                }`}
                        >
                            Đánh giá cao
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                                <th className="pb-3 px-2 w-12 text-center">Hạng</th>
                                <th className="pb-3 px-2">Tên truyện</th>
                                <th className="pb-3 px-2">Tác giả</th>
                                <th className="pb-3 px-2 text-right">
                                    {activeTab === 'views' ? 'Lượt xem' : 'Điểm ($)'}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {displayNovels && displayNovels.length > 0 ? displayNovels.map((novel, idx) => (
                                <tr key={novel._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                    <td className="py-4 px-2 text-center">
                                        <div className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs
                                            ${idx === 0 ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' :
                                                idx === 1 ? 'bg-gray-200 text-gray-700' :
                                                    idx === 2 ? 'bg-orange-100 text-orange-700' :
                                                        'text-gray-500 bg-gray-100'}`}
                                        >
                                            {idx + 1}
                                        </div>
                                    </td>
                                    <td className="py-4 px-2">
                                        <div className="font-medium text-gray-900 line-clamp-1">{novel.title}</div>
                                    </td>
                                    <td className="py-4 px-2 text-gray-500">
                                        {novel.authorId?.username || 'Vô danh'}
                                    </td>
                                    <td className="py-4 px-2 text-right">
                                        {activeTab === 'views' ? (
                                            <div className="flex justify-end items-center gap-1.5 text-blue-400 font-medium">
                                                <Eye className="w-3.5 h-3.5" />
                                                {formatNumber(novel.views || 0)}
                                            </div>
                                        ) : (
                                            <div className="flex justify-end items-center gap-1.5 text-amber-400 font-medium">
                                                <Star className="w-3.5 h-3.5 fill-amber-400/20" />
                                                {Number(novel.rating).toFixed(1)}
                                                <span className="text-gray-500 text-xs font-normal">({novel.ratingsCount})</span>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="py-8 text-center text-gray-500">Chưa có dữ liệu</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            <div className="flex flex-col gap-6">

                {/* Active Authors/Novels */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}
                    className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-5"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-1.5 bg-red-50 text-red-600 rounded-lg">
                            <Flame className="w-4 h-4" />
                        </div>
                        <h3 className="font-bold text-gray-900">Sôi nổi tháng qua</h3>
                    </div>
                    <div className="space-y-4">
                        {mostActive && mostActive.length > 0 ? mostActive.map((novel: any, idx) => (
                            <div key={idx} className="flex flex-col justify-center border-b border-gray-50 last:border-0 pb-3 last:pb-0">
                                <div className="text-sm font-medium text-gray-800 line-clamp-1 group-hover:text-blue-600 transition-colors">
                                    {novel.title || novel._id?.title || "Tác phẩm ẩn"}
                                </div>
                                <div className="flex items-center text-xs text-gray-500 mt-1 gap-2">
                                    <span className="text-gray-600">@{novel.authorId?.username || novel._id?.authorId?.username || "Ẩn danh"}</span>
                                    <span>•</span>
                                    <span className="text-red-500 bg-red-50 px-1.5 py-0.5 rounded font-medium">{novel.chaptersCount} chương</span>
                                </div>
                            </div>
                        )) : (
                            <div className="text-sm text-gray-500 italic text-center py-2">Chưa có dữ liệu</div>
                        )}
                    </div>
                </motion.div>

                {/* New Users Feed */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }}
                    className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-5 flex-1"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                            <Clock className="w-4 h-4" />
                        </div>
                        <h3 className="font-bold text-gray-900">Thành viên mới</h3>
                    </div>

                    <div className="space-y-4">
                        {newestUsers && newestUsers.length > 0 ? newestUsers.map(user => (
                            <div key={user._id} className="flex items-center gap-3 group border-b border-gray-50 last:border-0 pb-3 last:pb-0">
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200 group-hover:border-indigo-400 transition-colors">
                                    {(user.profile?.avatar?.publicId) ? (
                                        <CustomImage
                                            src={`https://res.cloudinary.com/${cloudname}/image/upload/${user.profile.avatar.publicId}.${user.profile.avatar.format}`}
                                            alt={user.username}
                                            width={40} height={40}
                                        />
                                    ) : (
                                        <CustomImage
                                            src={defaultFallback}
                                            alt={user.username}
                                            width={40} height={40}
                                        />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-gray-900 truncate">{user.username}</span>
                                        {user.role === 'writer' && <span className="px-1.5 py-[1px] bg-green-50 text-green-600 text-[10px] uppercase rounded font-bold">TG</span>}
                                        {user.role === 'admin' && <span className="px-1.5 py-[1px] bg-red-50 text-red-600 text-[10px] uppercase rounded font-bold">Admin</span>}
                                    </div>
                                    <p className="text-xs text-gray-500 truncate mt-0.5">{user.email}</p>
                                </div>
                                <div className="text-[10px] text-gray-600 whitespace-nowrap">
                                    {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true, locale: vi })}
                                </div>
                            </div>
                        )) : (
                            <div className="text-sm text-gray-500 italic text-center py-2">Chưa có người dùng mới</div>
                        )}
                    </div>
                </motion.div>

            </div>
        </div>
    );
}
