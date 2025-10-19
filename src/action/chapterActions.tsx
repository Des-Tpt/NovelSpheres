export async function getChapterById(chapterId: string, userId?: string) {
    const url = userId
        ? `/api/chapter/${chapterId}?userId=${userId}`
        : `/api/chapter/${chapterId}`;

    const res = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.PRIVATE_API_KEY!,
        },
    });

    if (!res.ok) {
        throw Error(`Không thể lấy chapter!`);
    }

    const data = await res.json();
    return data;
}

export const createChapter = async (postData: {
    userId: string;
    novelId: string;
    actId: string;
    title: string;
    chapterNumber: number;
    content: string;
    wordCount: number;
}) => {
    const response = await fetch(`/api/novels/${postData.novelId}/${postData.actId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.PRIVATE_API_KEY!,
        },
        body: JSON.stringify(postData),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw { message: errorData.error || 'Lỗi khi tạo post!', data: errorData };
    }

    return await response.json();
}

export const updateChapter = async (postData: {
    chapterId: string;
    userId: string;
    novelId: string;
    actId: string;
    title: string;
    chapterNumber: number;
    content?: string;
    wordCount?: number;
}) => {
    const response = await fetch(`/api/novels/${postData.novelId}/${postData.actId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.PRIVATE_API_KEY!,
        },
        body: JSON.stringify({
            chapterId: postData.chapterId,
            userId: postData.userId,
            title: postData.title,
            chapterNumber: postData.chapterNumber,
            ...(postData.content && postData.content.trim() && {
                content: postData.content,
                wordCount: postData.wordCount || 0
            })
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw { message: errorData.error || 'Lỗi khi cập nhật chapter!', data: errorData };
    }

    return await response.json();
}


export const deleteChapter = async (postData: {
    actId: string;
    userId: string;
    novelId: string;
    chapterId: string;
}) => {
    const formData = new FormData();
    formData.append('userId', postData.userId);
    formData.append('chapterId', postData.chapterId);

    const response = await fetch(`/api/novels/${postData.novelId}/${postData.actId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.PRIVATE_API_KEY!,
        },
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw { message: errorData.error || 'Lỗi khi xóa chapter!', data: errorData };
    }

    return await response.json();
};

export async function getNovelsForNovelsPage({
    page = 1,
    genreIds = [],
    sort = 'date'
}: {
    page?: number;
    genreIds?: string[];
    sort?: 'title' | 'date' | 'views';
}) {
    const formData = new FormData();
    formData.append('page', page.toString());
    formData.append('sort', sort);

    genreIds.forEach((id) => {
        formData.append('genreId', id);
    });

    const res = await fetch('/api/novels', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.PRIVATE_API_KEY!,
        },
        body: formData,
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw Error(errorData.error || 'Lỗi khi tải tiểu thuyết!');
    }

    return await res.json();
}