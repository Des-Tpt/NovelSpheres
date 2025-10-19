export const getUserFromCookies = async () => {
    try {
        const res = await fetch("/api/user/me", {
            method: "GET",
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.PRIVATE_API_KEY!,
            },
            credentials: "include"
        });
        const data = await res.json();
        if (res.ok) return data;
    } catch (e) {
        return null;
    }
}