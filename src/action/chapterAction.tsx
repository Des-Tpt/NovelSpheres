export async function getChapterById(ChapterId: string) {
    const res = await fetch(`/api/chapter//${ChapterId}`);

    if (!res.ok) {
        throw new Error(`Không thể lấy post!`);
    }

    const data = await res.json();
    return data;
}