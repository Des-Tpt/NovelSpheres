const getImage = async (publicId: string, format: string): Promise<string> => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_NAME as string;
    const url = `https://res.cloudinary.com/${cloudName!}/image/upload/${encodeURIComponent(publicId)}.${format}`;
    const fallback = `https://res.cloudinary.com/${cloudName!}/image/upload/LightNovel/BookCover/96776418_p0_qov0r8.png`;

    try {
        const res = await fetch(url, { method: "HEAD" });
        if (!res.ok) throw new Error();
        return url;
    } catch {
        return fallback;
    }
};

export default getImage;