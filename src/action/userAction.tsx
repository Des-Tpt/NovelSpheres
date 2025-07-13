export const getUserFromCookies = async () => {
    try {
        const res = await fetch("/api/user/me", { credentials: "include" });
        const data = await res.json();
        if (res.ok) return data;
    } catch (e) {
        console.log('Lỗi:', e);
        return null;
    }
}