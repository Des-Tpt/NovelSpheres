'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard, Users, BookOpen, MessageSquare,
    Settings, LogOut, ArrowLeft, Tags
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DashboardSidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const navItems = [
        { name: 'Tổng quan', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Người dùng', href: '/dashboard/users', icon: Users },
        { name: 'Thể loại', href: '/dashboard/genres', icon: Tags },
        { name: 'Tiểu thuyết', href: '/dashboard/novels', icon: BookOpen },
        { name: 'Thảo luận', href: '/dashboard/discussions', icon: MessageSquare },
        { name: 'Cài đặt', href: '/dashboard/settings', icon: Settings },
    ];

    return (
        <aside className="w-64 h-screen bg-white border-r border-gray-200 shadow-[4px_0_24px_rgba(0,0,0,0.02)] flex flex-col z-20 shrink-0 sticky top-0">
            <div className="h-16 flex items-center px-6 border-b border-gray-100 mb-4">
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    NovelSpheres
                </span>
                <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-600 rounded">ADMIN</span>
            </div>

            <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 font-medium ${isActive
                                ? 'bg-blue-50/80 text-blue-700 shadow-sm border border-blue-100/50'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
                                }`}
                        >
                            <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                            {item.name}
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 border-t border-gray-100">
                <button
                    onClick={() => router.push('/')}
                    className="w-full flex items-center px-3 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors font-medium mb-1"
                >
                    <ArrowLeft className="w-5 h-5 mr-3 text-gray-400" />
                    Về trang chủ
                </button>
                <button className="w-full flex items-center px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium">
                    <LogOut className="w-5 h-5 mr-3 text-red-500" />
                    Đăng xuất
                </button>
            </div>
        </aside>
    );
}
