export const getProfile = async (userId: string) => {
    const response = await fetch(`/api/profile/${userId}`);

    if (!response.ok) {
        throw Error('Lỗi khi lấy dữ liệu trang cá nhân!');
    }

    return response.json();
};

interface UpdateProfileData {
    bio?: string;
    birthday?: string | Date;
    favorites?: string;
    occupation?: string;
    avatar?: File;
    coverImage?: File;
    socials?: {
        facebook?: string;
        twitter?: string;
        discord?: string;
        website?: string;
    };
}


interface UpdateProfileVariables {
    userId: string;
    data: UpdateProfileData;
}

export async function updateProfile({ userId, data }: UpdateProfileVariables) {
    const formData = new FormData();

    // Thêm các field text
    if (data.bio) formData.append('bio', data.bio);
    if (data.favorites) formData.append('favorites', data.favorites);
    if (data.occupation) formData.append('occupation', data.occupation);

    // Xử lý birthday
    if (data.birthday) {
        const birthdayStr = data.birthday instanceof Date
            ? data.birthday.toISOString().split('T')[0]
            : data.birthday;
        formData.append('birthday', birthdayStr);
    }

    // Thêm file avatar và coverImage
    if (data.avatar) formData.append('avatar', data.avatar);
    if (data.coverImage) formData.append('coverImage', data.coverImage);

    // Thêm socials
    if (data.socials) {
        if (data.socials.facebook) formData.append('facebook', data.socials.facebook);
        if (data.socials.twitter) formData.append('twitter', data.socials.twitter);
        if (data.socials.discord) formData.append('discord', data.socials.discord);
        if (data.socials.website) formData.append('website', data.socials.website);
    }

    const response = await fetch(`/api/profile/${userId}`, {
        method: 'PATCH',
        body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
        throw Error(result.error || `Lỗi khi cập nhật trang cá nhân`);
    }

    return result;
}

interface historyData {
    userId: string;
    page: number;
}

export async function getHistory({ userId, page }: historyData) {
    const response = await fetch(`/api/user/${userId}/histories?page=${page}`, {
        method: 'GET'
    });

    if (!response.ok) {
        throw Error('Lỗi khi lấy lịch sử đọc truyện!');
    }

    return response.json();
}

export async function getFavorites({ userId, page }: historyData) {
    const response = await fetch(`/api/user/${userId}/favorites?page=${page}`, {
        method: 'GET'
    });

    const result = await response.json();

    if (!response.ok) {
        console.log(result.error)
        throw Error('Lỗi khi lấy lịch sử đọc truyện!');
    }

    return result;
}