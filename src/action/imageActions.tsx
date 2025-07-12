const getImage = async (publicId: string, format: string): Promise<string | null> => {
        const url = `https://res.cloudinary.com/dr29oyoqx/image/upload/${encodeURIComponent(publicId)}.${format}`;
    
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error('Fetch ảnh thất bại');
            const blob = await res.blob();
            return URL.createObjectURL(blob);
        } catch (err) {
            const url = `https://res.cloudinary.com/dr29oyoqx/image/upload/LightNovel/BookCover/96776418_p0_qov0r8.png`;
            const res = await fetch(url);
            const blob = await res.blob();
            return URL.createObjectURL(blob);
        }
    };

export default getImage;