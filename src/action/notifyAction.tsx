
export const getAllNotifications = async (data: { userId: string, page: number, limit: number, skip: number, status: string }) => {
    const response = await fetch(`/api/notification?userId=${data.userId}&page=${data.page}&limit=${data.limit}&status=${data.status}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.PRIVATE_API_KEY!,
        },
    })

    if (!response.ok) {
        const errorData = await response.json();
        throw { message: errorData.error || 'Lỗi khi lấy thông báo!', data: errorData };
    }

    return await response.json();
}

export const markRead = async (data: { userId: string, notificationIds?: string[], markAllAsRead?: boolean }) => {
    const response = await fetch(`/api/notification?userId=${data.userId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.PRIVATE_API_KEY!,
        },
        body: JSON.stringify({ notificationIds: data.notificationIds, markAllAsRead: data.markAllAsRead }),
    })

    if (!response.ok) {
        const errorData = await response.json();
        throw { message: errorData.error || 'Lỗi khi đánh dấu đã đọc!', data: errorData };
    }

    return await response.json();
}