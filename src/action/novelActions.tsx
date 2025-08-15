import INovelWithPopulate from "@/type/INovelWithPopulate";
type Genre = {
    _id: string;
    name: string;
}

export const getFeatureNovels = async () => {
    const res = await fetch(`/api/novels/feature-novels`);
    if (!res.ok) throw Error('Lỗi khi fetch dữ liệu');
    return res.json();
}

export const getGenres = async () => {
    const res = await fetch(`/api/genres`);
    if (!res.ok) throw Error('Lỗi khi fetch dữ liệu');
    return res.json();
}

export const getNovelByFilter = async (data: Genre[], sortBy: string): Promise<INovelWithPopulate[]> => {
    const query = data.length > 0
        ? `?${data.map(genre => `genreIds=${encodeURIComponent(genre._id)}`).join('&')}`
        : '';

    const url = `/api/novels/filter-novels${query}${query ? '&' : '?'}sortBy=${encodeURIComponent(sortBy)}`;

    const res = await fetch(url);
    if (!res.ok) {
        throw Error(`Lỗi khi fetch dữ liệu: ${res.status} - ${res.statusText}`);
    }

    const result = await res.json();
    return (Array.isArray(result) ? result : result.novels || []) as INovelWithPopulate[];
};

export const getNovelById = async (id: string) => {
    const res = await fetch(`/api/novels/${id}`);

    if (!res.ok) {
        throw Error('Không thể lấy tiểu thuyết!');
    }

    const data = await res.json();
    return data;
}

export const getNovelForNewPost = async (title: string) => {
    const res = await fetch(`/api/search-in-post?query=${encodeURIComponent(title)}`);

    if (!res.ok) {
        throw Error('Không thể lấy tiểu thuyết!');
    }

    const data = await res.json();
    return data;
}

export const createAct = async (postData: {
    userId: string;
    novelId: string;
    title: string;
    actNumber: number;
    actType: string;
    file?: File;
}) => {
    const formData = new FormData();
    formData.append('userId', postData.userId);
    formData.append('novelId', postData.novelId);
    formData.append('title', postData.title);
    formData.append('actNumber', String(postData.actNumber));
    formData.append('actType', String(postData.actType));

    if (postData.file) {
        formData.append('file', postData.file)
    };

    const response = await fetch(`/api/novels/${postData.novelId}`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw { message: errorData.error || 'Lỗi khi tạo act!', data: errorData };
    }

    return await response.json();
};

export const createNovel = async (postData: {
    userId: string;
    title: string;
    file?: File;
    status: string;
    description: string;
    genresId?: string[];
}) => {
    const formData = new FormData();
    formData.append('userId', postData.userId);
    formData.append('title', postData.title);
    formData.append('status', postData.status);
    formData.append('description', postData.description);

    if (postData.genresId) {
        postData.genresId.forEach(id => {
            formData.append('genresId', id);
        });
    }

    if (postData.file) {
        formData.append('file', postData.file)
    };

    const response = await fetch(`/api/novels/create-novel`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw { message: errorData.error || 'Lỗi khi tạo act!', data: errorData };
    }

    return await response.json();
}

export const updateNovel = async (postData: {
    userId: string;
    novelId: string;
    title: string;
    file?: File;
    status: string;
    description: string;
    genresId?: string[];
}) => {
    const formData = new FormData();
    formData.append('userId', postData.userId);
    formData.append('title', postData.title);
    formData.append('status', postData.status);
    formData.append('description', postData.description);

    if (postData.genresId) {
        postData.genresId.forEach(id => {
            formData.append('genresId', id);
        });
    }

    if (postData.file) {
        formData.append('file', postData.file)
    };

    const response = await fetch(`/api/novels/${postData.novelId}`, {
        method: 'PUT',
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw { message: errorData.error || 'Lỗi khi tạo act!', data: errorData };
    }

    return await response.json();
};

export const updateAct = async (postData: {
    actId: string;
    userId: string;
    novelId: string;
    title: string;
    actNumber: number;
    actType: string;
    file?: File;
}) => {
    const formData = new FormData();
    formData.append('actId', postData.actId);
    formData.append('userId', postData.userId);
    formData.append('novelId', postData.novelId);
    formData.append('title', postData.title);
    formData.append('actNumber', String(postData.actNumber));
    formData.append('actType', String(postData.actType));

    if (postData.file) {
        formData.append('file', postData.file)
    };

    const response = await fetch(`/api/novels/${postData.novelId}`, {
        method: 'PATCH',
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw { message: errorData.error || 'Lỗi khi sửa act!', data: errorData };
    }

    return await response.json();
};


export const deleteAct = async (postData: {
    actId: string;
    userId: string;
    novelId: string;
}) => {
    const formData = new FormData();
    formData.append('actId', postData.actId);
    formData.append('userId', postData.userId);

    const response = await fetch(`/api/novels/${postData.novelId}`, {
        method: 'DELETE',
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw { message: errorData.error || 'Lỗi khi xóa act!', data: errorData };
    }

    return await response.json();
};
