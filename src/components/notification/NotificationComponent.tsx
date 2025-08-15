'use client'
import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, MessageCircle, BookOpen, UserPlus, Loader2 } from 'lucide-react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPusherWithSession } from '@/lib/pusher-client';
import { notifySuccess } from '@/utils/notify';
import { getAllNotifications, markRead } from '@/action/notifyAction';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface Notification {
    _id: string;
    userId: string;
    type: 'chapter_update' | 'comment_reply' | 'follow_update';
    message: string;
    href: string;
    isRead: boolean;
    createdAt: string;
}

interface NotificationProps {
    userId: string;
}

const NotificationComponent: React.FC<NotificationProps> = ({ userId }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');
    const [unreadCount, setUnreadCount] = useState(0);
    const router = useRouter();
    const queryClient = useQueryClient();
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Get notifications with infinite scroll
    const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, error } = useInfiniteQuery({
        queryKey: ['notifications', userId, filter],
        queryFn: ({ pageParam = 1 }) => getAllNotifications({
            userId,
            page: pageParam,
            limit: 10,
            skip: (pageParam - 1) * 10,
            status: filter
        }),
        enabled: !!userId,
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            return lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined;
        },
    });

    console.log(data)

    // Mark as read mutation
    const markAsReadMutation = useMutation({
        mutationFn: markRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    useEffect(() => {
        if (isError && error) {
            // Handle error if needed
        }
    }, [isError, error]);

    // Update unread count when data changes
    useEffect(() => {
        if (data?.pages?.[0]?.meta?.unreadCount !== undefined) {
            setUnreadCount(data.pages[0].meta.unreadCount);
        }
    }, [data]);

    // Lock body scroll when popup is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    // Setup Pusher
    useEffect(() => {
        if (!userId) return;

        const pusher = createPusherWithSession();
        const channel = pusher.subscribe(`private-user-${userId}`);

        const handleNewNotification = (data: { message: string }) => {
            notifySuccess(data.message);
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            setUnreadCount(prev => prev + 1);
        };

        channel.bind("new-notification", handleNewNotification);

        return () => {
            channel.unbind("new-notification", handleNewNotification);
            pusher.unsubscribe(`private-user-${userId}`);
        };
    }, [userId, queryClient]);

    // Handle ESC key
    useEffect(() => {
        const handleEscKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscKey);
        }

        return () => {
            document.removeEventListener('keydown', handleEscKey);
        };
    }, [isOpen]);

    // Flatten notifications
    const notifications = data?.pages.flatMap(page => page.data) || [];
    const filteredNotifications = filter === 'unread'
        ? notifications.filter(n => !n.isRead)
        : notifications;

    // Handlers
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (scrollHeight - scrollTop <= clientHeight + 10 && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    };

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.isRead) {
            markAsReadMutation.mutate({
                userId,
                notificationIds: [notification._id]
            });
        }

        // Navigate to href
        if (notification.href) {
            router.push(notification.href);
        }
        
        // Close the notification dropdown after clicking
        setIsOpen(false);
    };

    const handleMarkAllAsRead = () => {
        markAsReadMutation.mutate({ userId, markAllAsRead: true });
    };

    // Handle backdrop click
    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            setIsOpen(false);
        }
    };

    // Helper functions
    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'chapter_update':
                return <BookOpen className="w-4 h-4 text-blue-400" />;
            case 'comment_reply':
                return <MessageCircle className="w-4 h-4 text-green-400" />;
            case 'follow_update':
                return <UserPlus className="w-4 h-4 text-purple-400" />;
            default:
                return <Bell className="w-4 h-4 text-gray-400" />;
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const now = new Date();
        const date = new Date(dateString);
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) {
            return diffMins <= 1 ? 'Vừa xong' : `${diffMins} phút trước`;
        } else if (diffHours < 24) {
            return `${diffHours} giờ trước`;
        } else {
            return `${diffDays} ngày trước`;
        }
    };

    return (
        <div className="relative">
            {/* Bell Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
            >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
                    >
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </motion.span>
                )}
            </motion.button>

            {/* Dropdown Backdrop and Modal */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 bg-black/60 z-40"
                            onClick={handleBackdropClick}
                            style={{
                                backdropFilter: 'blur(2px)',
                                WebkitBackdropFilter: 'blur(2px)'
                            }}
                        />

                        {/* Dropdown */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: -20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: -20 }}
                            transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 25,
                                duration: 0.3
                            }}
                            className="absolute right-0 mt-2 w-80 bg-gray-900 rounded-lg shadow-xl border border-gray-700 z-50"
                        >
                            {/* Header */}
                            <div className="p-4 border-b border-gray-700">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-lg font-semibold text-white">Thông báo</h3>
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => setIsOpen(false)}
                                        className="text-gray-400 hover:text-white transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </motion.button>
                                </div>

                                {/* Filter tabs */}
                                <div className="flex gap-2 mb-2">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setFilter('all')}
                                        className={`px-3 py-1 text-sm rounded-full transition-colors ${
                                            filter === 'all' 
                                                ? 'bg-blue-600 text-white border-2 border-blue-400' 
                                                : 'text-gray-300 hover:bg-gray-800 border-2 border-gray-600'
                                        }`}
                                    >
                                        Tất cả
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setFilter('unread')}
                                        className={`px-3 py-1 text-sm rounded-full transition-colors ${
                                            filter === 'unread' 
                                                ? 'bg-blue-600 text-white border-2 border-blue-400' 
                                                : 'text-gray-300 hover:bg-gray-800 border-2 border-gray-600'
                                        }`}
                                    >
                                        Chưa đọc ({unreadCount})
                                    </motion.button>
                                </div>

                                {unreadCount > 0 && (
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleMarkAllAsRead}
                                        disabled={markAsReadMutation.isPending}
                                        className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 disabled:opacity-50 transition-colors"
                                    >
                                        {markAsReadMutation.isPending ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                            <Check className="w-3 h-3" />
                                        )}
                                        Đánh dấu tất cả đã đọc
                                    </motion.button>
                                )}
                            </div>

                            {/* List */}
                            <div
                                ref={scrollContainerRef}
                                className="max-h-96 overflow-y-auto"
                                onScroll={handleScroll}
                            >
                                {isLoading ? (
                                    <div className="p-6 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                                        <p className="text-sm text-gray-400 mt-2">Đang tải...</p>
                                    </div>
                                ) : isError ? (
                                    <div className="p-6 text-center text-red-400">
                                        <p>Có lỗi xảy ra!</p>
                                    </div>
                                ) : filteredNotifications.length === 0 ? (
                                    <div className="p-6 text-center text-gray-500">
                                        <Bell className="w-12 h-12 mx-auto mb-2 text-gray-600" />
                                        <p>Không có thông báo nào</p>
                                    </div>
                                ) : (
                                    <>
                                        {filteredNotifications.map((notification, index) => (
                                            <motion.div
                                                key={notification._id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className={`p-4 border-b border-gray-800 hover:bg-gray-800 cursor-pointer transition-colors ${
                                                    !notification.isRead 
                                                        ? 'bg-gray-800/50 border-l-4 border-l-blue-500' 
                                                        : ''
                                                }`}
                                                onClick={() => handleNotificationClick(notification)}
                                                whileHover={{ x: 4 }}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="flex-shrink-0 mt-1">
                                                        {getNotificationIcon(notification.type)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-sm ${
                                                            !notification.isRead 
                                                                ? 'font-medium text-white' 
                                                                : 'text-gray-300'
                                                        }`}>
                                                            {notification.message}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {formatTimeAgo(notification.createdAt)}
                                                        </p>
                                                    </div>
                                                    {!notification.isRead && (
                                                        <motion.div
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            className="w-2 h-2 bg-blue-500 rounded-full mt-2"
                                                        />
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))}

                                        {isFetchingNextPage && (
                                            <div className="p-4 text-center">
                                                <Loader2 className="w-5 h-5 animate-spin mx-auto text-gray-400" />
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Footer */}
                            {filteredNotifications.length > 0 && (
                                <div className="p-3 border-t border-gray-700 text-center">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                                    >
                                        Xem tất cả thông báo
                                    </motion.button>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationComponent;