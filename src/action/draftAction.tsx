import { Draft } from "@/type/Draft";

export async function createDraft(userId: string, novelId: string, actId: string, title: string, chapterNumber: number): Promise<{ draft: Draft }> {
    const res = await fetch(`/api/workspace/novels/${novelId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.PRIVATE_API_KEY!
        },
        body: JSON.stringify({ userId, actId, title, chapterNumber, content: '', wordCount: 0 })
    });
    if (!res.ok) throw new Error('Lỗi khi tạo bản nháp');
    return res.json();
}

export async function deleteDraft(novelId: string, draftId: string): Promise<void> {
    const res = await fetch(`/api/workspace/novels/${novelId}/drafts/${draftId}`, {
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.PRIVATE_API_KEY!
        },
        method: 'DELETE'
    });
    if (!res.ok) throw new Error('Lỗi khi xóa bản nháp');
}

interface DraftData {
    _id: string;
    title: string;
    content: string;
    wordCount: number;
    updatedAt: string;
}

export async function fetchDraft(novelId: string, draftId: string): Promise<{ draft: DraftData }> {
    const res = await fetch(`/api/workspace/novels/${novelId}/drafts/${draftId}`);
    if (!res.ok) throw new Error('Không tìm thấy bản nháp');
    return res.json();
}

export async function updateDraft(novelId: string, draftId: string, data: { title?: string; content?: string; wordCount?: number }) {
    const res = await fetch(`/api/workspace/novels/${novelId}/drafts/${draftId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Lỗi khi lưu');
    return res.json();
}
