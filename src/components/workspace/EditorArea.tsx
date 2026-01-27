"use client";

import { useState, useEffect } from 'react';
import { Save, Loader2, Layout, ZoomIn, ZoomOut } from 'lucide-react';
import WorkspaceEditorContent from './WorkspaceEditorContent';
import EditorToolbar from './EditorToolbar';
import { notifySuccess, notifyError } from '@/utils/notify';
import getWordCountFromHtml from '@/utils/getWordCountFromHtml';

interface EditorAreaProps {
    chapter: any | null;
    theme: 'light' | 'dark';
    novelId: string;
}

export default function EditorArea({ chapter, theme, novelId }: EditorAreaProps) {
    const [content, setContent] = useState<string>('');
    const [wordCount, setWordCount] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [zoom, setZoom] = useState(100);
    const [editor, setEditor] = useState<any>(null);

    const zoomLevels = [75, 100, 125, 150, 200];

    const handleZoomIn = () => {
        const currentIndex = zoomLevels.indexOf(zoom);
        if (currentIndex < zoomLevels.length - 1) {
            setZoom(zoomLevels[currentIndex + 1]);
        }
    };

    const handleZoomOut = () => {
        const currentIndex = zoomLevels.indexOf(zoom);
        if (currentIndex > 0) {
            setZoom(zoomLevels[currentIndex - 1]);
        }
    };

    // Card styling
    const cardBg = theme === 'light' ? 'bg-white' : 'bg-gray-900';
    const cardBorder = theme === 'light' ? 'border border-gray-200' : 'border border-gray-800';
    const cardShadow = theme === 'light' ? 'shadow-sm' : 'shadow-sm shadow-gray-900/50';
    const cardClass = `${cardBg} ${cardBorder} ${cardShadow} rounded-xl overflow-hidden`;

    const textHeaderClass = theme === 'light' ? 'text-gray-900' : 'text-gray-100';
    const textMutedClass = theme === 'light' ? 'text-gray-500' : 'text-gray-500';

    // Load chapter content
    useEffect(() => {
        if (chapter) {
            const loadContent = async () => {
                try {
                    const res = await fetch(`/api/chapter/${chapter._id}`);
                    const data = await res.json();
                    setContent(data.content || '');
                    setWordCount(getWordCountFromHtml(data.content || ''));
                    setHasChanges(false);
                } catch (error) {
                    console.error('Error loading chapter:', error);
                }
            };
            loadContent();
        } else {
            setContent('');
            setWordCount(0);
        }
    }, [chapter]);

    const handleContentChange = (html: string) => {
        setContent(html);
        setWordCount(getWordCountFromHtml(html));
        setHasChanges(true);
    };

    const handleSave = async () => {
        if (!chapter || !hasChanges) return;

        setIsSaving(true);
        try {
            const res = await fetch(`/api/chapter/${chapter._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content, wordCount }),
            });

            if (res.ok) {
                notifySuccess('Saved successfully!');
                setHasChanges(false);
            } else {
                notifyError('Failed to save');
            }
        } catch (error) {
            notifyError('Error saving chapter');
        } finally {
            setIsSaving(false);
        }
    };

    if (!chapter) {
        return (
            <div className={`flex-1 flex items-center justify-center ${cardClass}`}>
                <div className="text-center max-w-md p-8">
                    <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'}`}>
                        <Layout size={40} className={theme === 'light' ? 'text-gray-400' : 'text-gray-500'} />
                    </div>
                    <h3 className={`text-xl font-bold mb-2 ${textHeaderClass}`}>Start Writing</h3>
                    <p className={`${textMutedClass} mb-8`}>Select a chapter from the sidebar or create a new one to begin editing your novel.</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex-1 flex flex-col ${cardClass}`}>
            <div className={`border-b ${theme === 'light' ? 'border-gray-100' : 'border-gray-800'} px-6 py-4 flex items-center justify-between ${cardBg}`}>
                <div>
                    <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${theme === 'light' ? 'bg-gray-100 text-gray-500' : 'bg-gray-800 text-gray-400'}`}>Chương {chapter.chapterNumber}</span>
                        <span className={`text-xs ${textMutedClass}`}>{wordCount} từ</span>
                    </div>
                    <h2 className={`font-bold text-xl mt-1 ${textHeaderClass}`}>{chapter.title || `Chưa có tiêu đề`}</h2>
                </div>

                <div className="flex items-center gap-3">
                    {/* Zoom Controls */}
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-800'}`}>
                        <button
                            onClick={handleZoomOut}
                            disabled={zoom <= zoomLevels[0]}
                            className={`p-1 rounded transition ${textMutedClass} hover:${textHeaderClass} disabled:opacity-30 disabled:cursor-not-allowed`}
                            title="Zoom Out"
                        >
                            <ZoomOut size={16} />
                        </button>
                        <span className={`text-sm font-medium ${textMutedClass} min-w-[3rem] text-center`}>
                            {zoom}%
                        </span>
                        <button
                            onClick={handleZoomIn}
                            disabled={zoom >= zoomLevels[zoomLevels.length - 1]}
                            className={`p-1 rounded transition ${textMutedClass} hover:${textHeaderClass} disabled:opacity-30 disabled:cursor-not-allowed`}
                            title="Zoom In"
                        >
                            <ZoomIn size={16} />
                        </button>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={!hasChanges || isSaving}
                        className={`px-5 py-2 rounded-lg font-medium flex items-center gap-2 transition-all duration-200 shadow-sm
                            ${!hasChanges
                                ? (theme === 'light' ? 'bg-gray-100 text-gray-400' : 'bg-gray-800 text-gray-500')
                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'} 
                            disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        <span>Lưu</span>
                    </button>
                </div>
            </div>

            {/* Formatting Toolbar - Not zoomed */}
            <div className={`border-b ${theme === 'light' ? 'border-gray-100' : 'border-gray-800'} ${cardBg}`}>
                <EditorToolbar editor={editor} theme={theme} />
            </div>

            {/* Page Container with Zoom - Only content zooms */}
            <div className={`flex-1 overflow-auto ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-800'} p-8`}>
                <div
                    className="mx-auto transition-transform duration-200 origin-top"
                    style={{
                        width: '21cm',
                        transform: `scale(${zoom / 100})`,
                    }}
                >
                    <div className={`${theme === 'light' ? 'bg-white shadow-lg' : 'bg-gray-900 shadow-xl shadow-black/30'}`}>
                        <WorkspaceEditorContent
                            content={content}
                            onChange={handleContentChange}
                            placeholder="Hãy bắt đầu viết..."
                            minHeight="29.7cm"
                            theme={theme}
                            onEditorReady={setEditor}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
