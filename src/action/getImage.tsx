const getImage = async (publicId: string, format: string): Promise<string | null> => {
        const url = `https://res.cloudinary.com/dr29oyoqx/image/upload/${encodeURIComponent(publicId)}.${format}`;
    
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error('Fetch ảnh thất bại');
            const blob = await res.blob();
            return URL.createObjectURL(blob);
        } catch (err) {
            console.error('Lỗi khi fetch ảnh:', err);
            return null;
        }
    };

export default getImage;