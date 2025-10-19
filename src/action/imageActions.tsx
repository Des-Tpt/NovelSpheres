'use client'
const getImage = async (publicId?: string, format?: string) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_NAME! as string;

    const fallback = `https://res.cloudinary.com/${cloudName!}/image/upload/LightNovel/BookCover/96776418_p0_qov0r8.png`;
    try {
        if (!publicId || !format || publicId === '' || format === '') return fallback;

        const url = `https://res.cloudinary.com/${cloudName!}/image/upload/${encodeURIComponent(publicId)}.${format}`;
        const res = await fetch(url, { method: "HEAD" });

        if (!res.ok) return fallback;

        return url;
    } catch {
        return fallback;
    }
};

export default getImage;

interface ImageData {
    userId: string,
    file: File,
}

export const editAvatar = async ({ userId, file }: ImageData) => {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await fetch(`/api/profile/${userId}/change-avatar`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.PRIVATE_API_KEY!,
        },
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw Error(errorData.message || "Lỗi khi cập nhật ảnh đại diện!");
    }

    return response.json();
}