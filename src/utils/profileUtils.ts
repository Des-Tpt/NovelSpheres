
export const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
};

export const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return 'Vừa xong';
    if (hours < 24) return `${hours} giờ trước`;
    if (days === 1) return 'Hôm qua';
    if (days < 7) return `${days} ngày trước`;
    return date.toLocaleDateString('vi-VN');
};

export const getStatusColor = (status: string): string => {
    switch (status) {
        case 'Ongoing': return 'bg-blue-500 text-white';
        case 'Completed': return 'bg-green-500 text-white';
        case 'Hiatus': return 'bg-yellow-500 text-black';
        default: return 'bg-gray-500 text-white';
    }
};

export const getStatusText = (status: string): string => {
    switch (status) {
        case 'Ongoing': return 'Đang ra';
        case 'Completed': return 'Hoàn thành';
        case 'Hiatus': return 'Tạm dừng';
        default: return status;
    }
};