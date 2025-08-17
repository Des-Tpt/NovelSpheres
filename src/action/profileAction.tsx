export const getProfile = async (userId: string) => {
    const response = await fetch(`/api/profile/${userId}`);

    if (!response.ok) {
        throw new Error('Failed to fetch profile');
    }

    return response.json();
};
