interface followData {
    userId: string;
    followingUserId: string;
}

export const followAction = async ({ userId, followingUserId }: followData) => {
    const response = await fetch(`/api/profile/${userId}/follow?followingUserId=${followingUserId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.PRIVATE_API_KEY!,
        },
        credentials: 'include'
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to follow/unfollow user');
    }

    const result = await response.json();
    return result;
}