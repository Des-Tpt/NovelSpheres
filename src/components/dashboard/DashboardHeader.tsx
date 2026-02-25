'use client';
import { useEffect, useState } from 'react';
import { getUserFromCookies } from '@/action/userAction';
import { Bell, Search, Menu } from 'lucide-react';
import { CurrentUser } from '@/type/CurrentUser';

export default function DashboardHeader({ onMenuClick }: { onMenuClick?: () => void }) {
    const [user, setUser] = useState<CurrentUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            const res = await getUserFromCookies();
            if (res?.user) {
                setUser(res.user);
            }
            setLoading(false);
        };
        fetchUser();
    }, []);

    return (
        <header className="h-16 bg-white border-b border-gray-200 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex items-center justify-between px-4 sm:px-6 sticky top-0 z-10">
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-100 lg:hidden"
                >
                    <Menu className="w-5 h-5" />
                </button>
            </div>

            <div className="flex items-center gap-3 sm:gap-5 lg:mr-4">
                <button className="relative p-2 text-gray-500 hover:bg-gray-50 rounded-full transition-colors border border-gray-100 shadow-sm">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                </button>

                <div className="h-8 w-[1px] bg-gray-200 hidden sm:block"></div>

                <div className="flex items-center gap-3">
                    <div className="hidden md:block text-right">
                        {loading ? (
                            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-1"></div>
                        ) : (
                            <p className="text-sm font-semibold text-gray-800">{user?.username || 'Admin User'}</p>
                        )}
                        <p className="text-xs text-gray-500 font-medium">Quản trị viên</p>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md ring-2 ring-white cursor-pointer hover:shadow-lg transition-all">
                        {user?.username ? user.username.charAt(0).toUpperCase() : 'A'}
                    </div>
                </div>
            </div>
        </header>
    );
}
