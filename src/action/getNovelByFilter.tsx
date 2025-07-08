type Genre = {
    _id: string;
    name: string;
}

import INovelWithPopulate from "@/type/INovelWithPopulate";

const getNovelByFilter = async (data: Genre[], sortBy: string ): Promise<INovelWithPopulate[]> => {
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

export default getNovelByFilter;