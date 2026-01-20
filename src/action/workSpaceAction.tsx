export async function getNovelsForWorkspace({ userId, page }: { userId: string, page: string }) {
    const res = await fetch(`/api/workspace/${userId}?page=${page}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.PRIVATE_API_KEY!,
        },
    });

    if (!res.ok) {
        throw new Error('Failed to fetch novels for workspace');
    }

    const data = await res.json();
    return data;
}

export async function getNovelForWorkspace({ novelId }: { novelId: string }) {
    const res = await fetch(`/api/novels/${novelId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.PRIVATE_API_KEY!,
        },
    })

    if (!res.ok) {
        throw new Error('Failed to fetch novel for workspace');
    }

    const data = await res.json();
    return data;
}

export async function getChapterForWorkspace({ novelId, chapterId }: { novelId: string, chapterId: string }) {
    const res = await fetch(`/api/novels/${novelId}/chapters/${chapterId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.PRIVATE_API_KEY!,
        },
    })

    if (!res.ok) {
        throw new Error('Failed to fetch chapter for workspace');
    }

    const data = await res.json();
    return data;
}

export async function getDraftForWorkspace({ novelId, draftId }: { novelId: string, draftId: string }) {
    const res = await fetch(`/api/novels/${novelId}/drafts/${draftId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.PRIVATE_API_KEY!,
        },
    })

    if (!res.ok) {
        throw new Error('Failed to fetch draft for workspace');
    }

    const data = await res.json();
    return data;
}
