import { create } from 'zustand';
import { persist, PersistStorage } from 'zustand/middleware';

interface Avatar {
    publicId: string;
    format: string;
}

interface UserState {
    avatar: Avatar | null;
    setAvatar: (avatar: Avatar) => void;
    resetAvatar: () => void;
}

const localStorageStorage: PersistStorage<UserState> = {
    getItem: (name) => {
        const value = localStorage.getItem(name);
        return value ? JSON.parse(value) : null;
    },
    setItem: (name, value) => {
        localStorage.setItem(name, JSON.stringify(value));
    },
    removeItem: (name) => {
        localStorage.removeItem(name);
    }
};

export const useUserStore = create<UserState>()(
    persist(
        (set) => ({
            avatar: null,
            setAvatar: (avatar) => set({ avatar }),
            resetAvatar: () => set({ avatar: null }),
        }),
        {
            name: 'user-storage',
            storage: typeof window !== 'undefined' ? localStorageStorage : undefined,
        }
    )
);
