import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, MessageCircle, BookOpen, UserPlus, Loader2 } from 'lucide-react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPusherWithSession } from '@/lib/pusher-client';
import { notifySuccess } from '@/utils/notify';
import { getAllNotifications, markRead } from '@/action/notifyAction';

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

    // Mark as read mutation
    const markAsReadMutation = useMutation({
        mutationFn: markRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    useEffect(() => {
        if (isError && error) {

        }
    }, [isError, error]);

    // Update unread count when data changes
    useEffect(() => {
        if (data?.pages?.[0]?.meta?.unreadCount !== undefined) {
            setUnreadCount(data.pages[0].meta.unreadCount);
        }
    }, [data]);

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

        if (notification.href) {
            window.location.href = notification.href;
        }
    };

    const handleMarkAllAsRead = () => {
        markAsReadMutation.mutate({ userId, markAllAsRead: true });
    };

    // Helper functions
    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'chapter_update':
                return <BookOpen className="w-4 h-4 text-blue-500" />;
            case 'comment_reply':
                return <MessageCircle className="w-4 h-4 text-green-500" />;
            case 'follow_update':
                return <UserPlus className="w-4 h-4 text-purple-500" />;
            default:
                return <Bell className="w-4 h-4 text-gray-500" />;
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
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
            >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                        {/* Header */}
                        <div className="p-4 border-b border-gray-200">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-lg font-semibold text-gray-900">Thông báo</h3>
                                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Filter tabs */}
                            <div className="flex gap-2 mb-2">
                                <button
                                    onClick={() => setFilter('all')}
                                    className={`px-3 py-1 text-sm rounded-full transition-colors ${filter === 'all' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    Tất cả
                                </button>
                                <button
                                    onClick={() => setFilter('unread')}
                                    className={`px-3 py-1 text-sm rounded-full transition-colors ${filter === 'unread' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    Chưa đọc ({unreadCount})
                                </button>
                            </div>

                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllAsRead}
                                    disabled={markAsReadMutation.isPending}
                                    className="text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1 disabled:opacity-50"
                                >
                                    {markAsReadMutation.isPending ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                        <Check className="w-3 h-3" />
                                    )}
                                    Đánh dấu tất cả đã đọc
                                </button>
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
                                </div>
                            ) : isError ? (
                                <div className="p-6 text-center text-red-500">
                                    <p>Lỗi!</p>
                                </div>
                            ) : filteredNotifications.length === 0 ? (
                                <div className="p-6 text-center text-gray-500">
                                    <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                    <p>Không có thông báo nào</p>
                                </div>
                            ) : (
                                <>
                                    {filteredNotifications.map((notification) => (
                                        <div
                                            key={notification._id}
                                            className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${!notification.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                                                }`}
                                            onClick={() => handleNotificationClick(notification)}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="flex-shrink-0 mt-1">
                                                    {getNotificationIcon(notification.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm ${!notification.isRead ? 'font-medium text-gray-900' : 'text-gray-700'
                                                        }`}>
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {formatTimeAgo(notification.createdAt)}
                                                    </p>
                                                </div>
                                                {!notification.isRead && (
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                                )}
                                            </div>
                                        </div>
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
                            <div className="p-3 border-t border-gray-200 text-center">
                                <button className="text-sm text-blue-500 hover:text-blue-600">
                                    Xem tất cả thông báo
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default NotificationComponent;