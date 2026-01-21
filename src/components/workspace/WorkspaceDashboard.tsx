"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import NovelCard from './NovelCard';
import { getNovelsForWorkspace } from '@/action/workSpaceAction';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';

interface User {
    _id: string;
    username: string;
}

interface WorkspaceDashboardProps {
    currentUser: User;
}

const WorkspaceDashboard: React.FC<WorkspaceDashboardProps> = ({ currentUser }) => {
    const router = useRouter();
    const [novels, setNovels] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const { data, isLoading, isError } = useQuery({
        queryKey: ['novels', page],
        queryFn: () => getNovelsForWorkspace({ userId: currentUser._id, page: page.toString() })
    })

    useEffect(() => {
        if (data) {
            setNovels(data.novels);
            setHasMore(data.hasMore);
        }
    }, [data]);

    const handleLoadMore = () => {
        if (hasMore) {
            setPage((prevPage) => prevPage + 1);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex justify-center items-center h-40">
                <div className="text-red-500">Failed to fetch novels</div>
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Novels</h1>
                    <p className="text-gray-400">
                        Chào {currentUser.username}, sẵn sàng để bắt đầu tiểu thuyết tiếp theo của bạn chưa?
                    </p>
                </div>
                <div className="mt-4 md:mt-0">
                    <button
                        onClick={() => router.push('/novels/create')}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg border border-indigo-500 transition-all shadow-lg hover:shadow-indigo-500/30"
                    >
                        <PlusIcon className="w-5 h-5" />
                        <span>Create a Novel</span>
                    </button>
                </div>
            </div>

            {/* Content Section */}
            {novels.length > 0 ? (
                <div>
                    {novels.map((novel) => (
                        <NovelCard key={novel._id} novel={novel} />
                    ))}

                    {hasMore && (
                        <button
                            onClick={handleLoadMore}
                            className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg border border-indigo-500 transition-all shadow-lg hover:shadow-indigo-500/30"
                        >
                            Load More
                        </button>
                    )}
                </div>
            ) : (
                <div className="text-center py-20 bg-gray-900/50 rounded-xl border border-dashed border-gray-700">
                    <h3 className="text-xl text-gray-300 font-medium mb-2">Bạn chưa có tiểu thuyết nào</h3>
                    <p className="text-gray-500 mb-6">Hãy bắt đầu sáng tác tác phẩm đầu tiên của bạn ngay hôm nay!</p>
                    <button
                        onClick={() => router.push('/novels/create')}
                        className="text-indigo-400 hover:text-indigo-300 underline"
                    >
                        Tạo tiểu thuyết mới
                    </button>
                </div>
            )}
        </div>
    );
};

export default WorkspaceDashboard;
