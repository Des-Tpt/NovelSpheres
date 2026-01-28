"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Moon, Sun, Home, Settings } from 'lucide-react';
import ChapterSidebar from './ChapterSidebar';
import EditorArea from './EditorArea';
import { useEditorTheme } from '@/hooks/useEditorTheme';
import { getNovelForWorkspace } from '@/action/workSpaceAction';

interface NovelEditorProps {
    novelId: string;
    novelTitle: string;
}

export default function NovelEditor({ novelId, novelTitle }: NovelEditorProps) {
    console.log('NovelEditor - props:', { novelId, novelTitle });
    const router = useRouter();
    const { theme, toggleTheme } = useEditorTheme();
    const [acts, setActs] = useState<any[]>([]);
    const [selectedChapter, setSelectedChapter] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchNovelData = async () => {
        try {
            setIsLoading(true);
            const data = await getNovelForWorkspace({ novelId });

            if (data && Array.isArray(data.responseData)) {
                setActs(data.responseData);
            } else if (data.novel && Array.isArray(data.novel.acts)) {
                setActs(data.novel.acts);
            }
        } catch (error) {
            console.error("Failed to fetch novel data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNovelData();
    }, [novelId]);

    const bgClass = theme === 'light' ? 'bg-gray-100' : 'bg-black';
    const textClass = theme === 'light' ? 'text-gray-900' : 'text-white';
    const headerBorder = theme === 'light' ? 'border-gray-200' : 'border-gray-800';
    const headerBg = theme === 'light' ? 'bg-white' : 'bg-gray-900';

    return (
        <div className={`flex flex-col h-screen overflow-hidden ${bgClass} ${textClass}`}>
            {/* Top Navigation Bar */}
            <div className={`h-14 border-b ${headerBorder} ${headerBg} flex items-center justify-between px-4 flex-shrink-0 z-10`}>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/workspace')}
                        className={`p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors`}
                        title="Back to Workspace"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex flex-col">
                        <h1 className="font-bold text-lg leading-tight truncate max-w-md">{novelTitle}</h1>
                        <span className="text-xs text-gray-500">Không gian sáng tác</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleTheme}
                        className={`p-2 rounded-lg transition-colors ${theme === 'light' ? 'hover:bg-gray-100 text-gray-600' : 'hover:bg-gray-800 text-gray-300'}`}
                        title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                    >
                        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden gap-4 p-4 pt-4">
                {/* Sidebar */}
                <div className="w-80 flex-shrink-0 h-full overflow-hidden bg-opacity-50 rounded-lg">
                    <div className="h-full">
                        <ChapterSidebar
                            acts={acts}
                            theme={theme}
                            selectedChapterId={selectedChapter?._id}
                            onSelectChapter={setSelectedChapter}
                            isLoading={isLoading}
                            novelId={novelId}
                            onUpdate={fetchNovelData}
                        />
                    </div>
                </div>

                {/* Main Editor Area */}
                <div className="flex-1 h-full min-w-0 bg-opacity-50 relative">
                    <EditorArea
                        chapter={selectedChapter}
                        theme={theme}
                    />
                </div>
            </div>
        </div>
    );
}
