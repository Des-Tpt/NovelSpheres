import INovelWithPopulate from "@/type/INovelWithPopulate";
type Genre = {
    _id: string;
    name: string;
}

export const getFeatureNovels = async () => {
    const res  = await fetch(`/api/novels/feature-novels`);
    if (!res.ok) throw new Error('Lỗi khi fetch dữ liệu');
  return res.json();
}

export const getGenres = async () => {
    const res  = await fetch(`/api/genres`);
    if (!res.ok) throw new Error('Lỗi khi fetch dữ liệu');
  return res.json();
}

export const getNovelByFilter = async (data: Genre[], sortBy: string ): Promise<INovelWithPopulate[]> => {
    const query = data.length > 0 
        ? `?${data.map(genre => `genreIds=${encodeURIComponent(genre._id)}`).join('&')}` 
        : '';

    const url = `/api/novels/filter-novels${query}${query ? '&' : '?'}sortBy=${encodeURIComponent(sortBy)}`;

    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Lỗi khi fetch dữ liệu: ${res.status} - ${res.statusText}`);
    }

    const result = await res.json();
    return (Array.isArray(result) ? result : result.novels || []) as INovelWithPopulate[];
};

export const getNovelById = async (id: string) => {
    const res = await fetch(`/api/novels/${id}`);

    if (!res.ok) {
        throw new Error('Không thể lấy tiểu thuyết!');
    }

    const data = await res.json();
    return data;
}

export const getNovelForNewPost = async (title: string) => {
    const res = await fetch(`api/search-in-post?query=${encodeURIComponent(title)}`);

    if (!res.ok) {
        throw new Error('Không thể lấy tiểu thuyết!');
    }

    const data = await res.json();
    return data;
}