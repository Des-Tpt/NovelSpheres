interface RatingData {
    novelId: string;
    userId: string;
    score: number;
    rate: string;
}

interface RatingResponse {
    rated: boolean;
    ratings?: {
        _id: string;
        userId: string;
        novelId: string;
        score: number;
        rate: string;
        createdAt: string;
        updatedAt: string;
    };
}

interface ApiResponse {
    message?: string;
    error?: string;
    rating?: any;
}

export const getRating = async (novelId: string, userId: string): Promise<RatingResponse> => {
    try {
        const response = await fetch(`/api/novels/${novelId}/rating?userId=${userId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.PRIVATE_API_KEY!,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Lỗi khi lấy đánh giá');
        }

        return await response.json();
    } catch (error) {
        throw error;
    }
};

export const createRating = async (data: RatingData): Promise<ApiResponse> => {
    try {
        const response = await fetch(`/api/novels/${data.novelId}/rating`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.PRIVATE_API_KEY!,
            },
            body: JSON.stringify({ userId: data.userId, score: data.score, rate: data.rate }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Lỗi khi tạo đánh giá');
        }

        return await response.json();
    } catch (error) {
        throw error;
    }
};

export const updateRating = async (data: RatingData): Promise<ApiResponse> => {
    try {
        const response = await fetch(`/api/novels/${data.novelId}/rating`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.PRIVATE_API_KEY!,
            },
            body: JSON.stringify({ userId: data.userId, score: data.score, rate: data.rate }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Lỗi khi cập nhật đánh giá');
        }

        return await response.json();
    } catch (error) {
        throw error;
    }
};

export const getNewRatings = async (novelId: string) => {
    try {
        const response = await fetch(`/api/novels/${novelId}/rating/new-ratings`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.PRIVATE_API_KEY!,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Lỗi khi cập nhật đánh giá');
        }

        return await response.json();
    } catch (error) {
        throw error;
    }
};

interface RatingDataForContainer {
    novelId: string;
    pageParam: number;
}

export async function getRatingsForContainer({ pageParam = 1, novelId }: RatingDataForContainer) {
    const res = await fetch(
        `/api/novels/${novelId}/rating/ratings-container?page=${pageParam}`,
        { cache: "no-store" }
    );
    if (!res.ok) throw new Error("Failed to load");
    return res.json();
}
