import { connectDB } from "@/lib/db";
import { Rating } from "@/model/Rating";

type LikeInput = {
    novelId: string;
    userId: string;
};

export async function getLike(novelId: string, userId: string) {
    const res = await fetch(`/api/novels/${novelId}/like?userId=${userId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.PRIVATE_API_KEY!,
        },
    });
    if (!res.ok) throw Error(`Lỗi khi fetch dữ liệu: ${res.status} - ${res.statusText}`);
    return res.json();
}

export async function Like(Like: LikeInput) {
    const res = await fetch(`/api/novels/${Like.novelId}/like`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.PRIVATE_API_KEY!,
        },
        body: JSON.stringify({ userId: Like.userId })
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw Error(errorData.error || `Lỗi khi fetch dữ liệu: ${res.status} - ${res.statusText}`);
    }

    return res.json();
}

export async function UnLike(Like: LikeInput) {
    const res = await fetch(`/api/novels/${Like.novelId}/like`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.PRIVATE_API_KEY!,
        },
        body: JSON.stringify({ userId: Like.userId })
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw Error(errorData.error || `Lỗi khi fetch dữ liệu: ${res.status} - ${res.statusText}`);
    }

    return res.json();
}
