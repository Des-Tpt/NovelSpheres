'use client';
import { useQuery } from '@tanstack/react-query';
import {
    Users, BookOpen, Layers, MessageSquare,
    MessageCircle, Activity, Info
} from 'lucide-react';
import StatCard from './StatCard';
import DashboardCharts from './DashboardCharts';
import LeaderboardWidgets from './LeaderboardWidgets';

export default function AdminDashboard() {
    const { data: dashboardData, isLoading, isError, error } = useQuery({
        queryKey: ['adminDashboardStats'],
        queryFn: async () => {
            const res = await fetch('/api/dashboard');
            const json = await res.json();
            if (!json.success) {
                throw new Error(json.message || 'Failed to fetch dashboard data');
            }
            return json.data;
        },
        staleTime: 5 * 60 * 1000,
    });

    if (isLoading) {
        return (
            <div className="w-full flex-col min-h-[50vh] flex items-center justify-center p-8">
                <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                <div className="text-gray-400 animate-pulse font-medium">Đang tải dữ liệu hệ thống...</div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="w-full p-8 border border-red-500/30 bg-red-500/10 rounded-2xl flex flex-col items-center justify-center mt-8">
                <Info className="w-12 h-12 text-red-400 mb-3" />
                <h3 className="text-lg font-bold text-red-300">Lỗi kết nối dữ liệu</h3>
                <p className="text-red-400/80 mt-1 max-w-md text-center text-sm">{error?.message || "Không thể tải Dashboard"}</p>
            </div>
        );
    }

    if (!dashboardData) return null;

    const overview = dashboardData.overview;

    return (
        <div className="w-full animate-in fade-in duration-500">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5 mb-8">
                <StatCard
                    title="Người dùng"
                    count={overview.totalUsers.count}
                    growth={overview.totalUsers.growth}
                    icon={Users} colorClass="blue" delay={0.1}
                />
                <StatCard
                    title="Tiểu thuyết"
                    count={overview.totalNovels.count}
                    growth={overview.totalNovels.growth}
                    icon={BookOpen} colorClass="indigo" delay={0.2}
                />
                <StatCard
                    title="Chương truyện"
                    count={overview.totalChapters.count}
                    growth={overview.totalChapters.growth}
                    icon={Layers} colorClass="purple" delay={0.3}
                />
                <StatCard
                    title="Tổng số chữ"
                    count={overview.totalWords.count}
                    growth={overview.totalWords.growth}
                    icon={Activity} colorClass="amber" delay={0.4}
                />
                <StatCard
                    title="Bình luận"
                    count={overview.totalComments.count}
                    growth={overview.totalComments.growth}
                    icon={MessageSquare} colorClass="pink" delay={0.5}
                />
                <StatCard
                    title="Thảo luận diễn đàn"
                    count={overview.totalForumPosts.count}
                    growth={overview.totalForumPosts.growth}
                    icon={MessageCircle} colorClass="emerald" delay={0.6}
                />
            </div>

            <DashboardCharts
                userStats={dashboardData.userStats}
                novelStats={dashboardData.novelStats}
            />

            <LeaderboardWidgets
                topViewed={dashboardData.topPerformers.topViewed}
                topRated={dashboardData.topPerformers.topRated}
                mostActive={dashboardData.topPerformers.mostActiveNovels}
                newestUsers={dashboardData.recentActivity.newestUsers}
            />

        </div>
    );
}
