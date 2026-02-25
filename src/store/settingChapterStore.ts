import { create } from 'zustand';

interface Store {
    fontSize: number;
    fontFamily: string;
    lineSpacing: number;
    paragraphSpacing: number;
    nightMode: 'light' | 'dark';
}

interface SettingChapterStore {
    fontSize: number;
    fontFamily: string;
    lineSpacing: number;
    paragraphSpacing: number;
    nightMode: 'light' | 'dark';
    setSettingChapterStore: (store: Store) => void;
}

export const useSettingChapterStore = create<SettingChapterStore>((set) => ({
    fontSize: 16,
    fontFamily: 'Arial',
    lineSpacing: 1.5,
    paragraphSpacing: 16,
    nightMode: 'dark',
    setSettingChapterStore: (store: Store) => set(() => ({
        fontSize: store.fontSize,
        fontFamily: store.fontFamily,
        lineSpacing: store.lineSpacing,
        paragraphSpacing: store.paragraphSpacing,
        nightMode: store.nightMode,
    }))
}));
