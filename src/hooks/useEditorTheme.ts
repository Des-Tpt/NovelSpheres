"use client";

import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'editorTheme';

export function useEditorTheme() {
    const [theme, setTheme] = useState<Theme>('dark');
    const [mounted, setMounted] = useState(false);

    // Load theme from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
        if (stored && (stored === 'light' || stored === 'dark')) {
            setTheme(stored);
        }
        setMounted(true);
    }, []);

    // Save theme to localStorage when it changes
    useEffect(() => {
        if (mounted) {
            localStorage.setItem(STORAGE_KEY, theme);
        }
    }, [theme, mounted]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    return { theme, toggleTheme, mounted };
}
