export async function getPost(id: string) {
    const res = await fetch(`/api/forum/posts/${id}`);

    if (!res.ok) {
        throw new Error(`Không thể lấy post!`);
    }

    const data = await res.json();
    return data;
}
