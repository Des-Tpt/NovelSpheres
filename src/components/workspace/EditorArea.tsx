"use client";

import { useState, useEffect, useRef } from 'react';
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
    const editorContentRef = useRef<HTMLDivElement>(null);
    const [contentHeight, setContentHeight] = useState(0);

    useEffect(() => {
        const element = editorContentRef.current;
        if (!element) return;

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setContentHeight(entry.contentRect.height);
            }
        });

        observer.observe(element);

        return () => {
            observer.disconnect();
        };
    }, [editor]);


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

    const cardBg = theme === 'light' ? 'bg-white' : 'bg-gray-900';
    const cardBorder = theme === 'light' ? 'border border-gray-200' : 'border border-gray-800';
    const cardShadow = theme === 'light' ? 'shadow-sm' : 'shadow-sm shadow-gray-900/50';
    const cardClass = `${cardBg} ${cardBorder} ${cardShadow} rounded-xl overflow-hidden`;

    const textHeaderClass = theme === 'light' ? 'text-gray-900' : 'text-gray-100';
    const textMutedClass = theme === 'light' ? 'text-gray-500' : 'text-gray-500';

    useEffect(() => {
        if (chapter) {
            const loadContent = async () => {
                try {
                    const res = await fetch(`/api/chapter/${chapter._id}`);
                    const data = await res.json();
                    const chapterContent = data.chapter?.content || '';
                    setContent(chapterContent);
                    setWordCount(getWordCountFromHtml(chapterContent));
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

    const handleSaveChapterAndPublish = async () => {
        if (!chapter || !hasChanges) return;

        setIsSaving(true);
        try {
            const res = await fetch(`/api/workspace/novels/${novelId}/chapters/${chapter._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content, wordCount }),
            });

            if (res.ok) {
                notifySuccess('Đã lưu thành công!');
                setHasChanges(false);
            } else {
                notifyError('Lưu thất bại!');
            }
        } catch (error) {
            notifyError('Lỗi khi lưu!');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveChapterAsDraft = async () => {
        if (!chapter || !hasChanges) return;

        setIsSaving(true);
        try {
            const res = await fetch(`/api/workspace/novels/${novelId}/chapters/${chapter._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content, wordCount }),
            });

            if (res.ok) {
                notifySuccess('Đã lưu thành công!');
                setHasChanges(false);
            } else {
                notifyError('Lưu thất bại!');
            }
        } catch (error) {
            notifyError('Lỗi khi lưu!');
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
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
            <div className={`flex-shrink-0 border-b ${theme === 'light' ? 'border-gray-200 bg-white' : 'border-gray-800 bg-gray-900'} px-4 py-2 flex items-center justify-between z-10`}>
                <div>
                    <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${theme === 'light' ? 'bg-gray-100 text-gray-500' : 'bg-gray-800 text-gray-400'}`}>Chương {chapter.chapterNumber}</span>
                        <span className={`text-xs ${textMutedClass}`}>{wordCount} từ</span>
                    </div>
                    <h2 className={`font-bold text-lg mt-0.5 ${textHeaderClass} truncate max-w-md`}>{chapter.title || `Chưa có tiêu đề`}</h2>
                </div>

                <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-800'}`}>
                        <button
                            onClick={handleZoomOut}
                            disabled={zoom <= zoomLevels[0]}
                            className={`p-1 rounded transition ${textMutedClass} hover:${textHeaderClass} disabled:opacity-30 disabled:cursor-not-allowed`}
                            title="Zoom Out"
                        >
                            <ZoomOut size={14} />
                        </button>
                        <span className={`text-xs font-medium ${textMutedClass} min-w-[2.5rem] text-center`}>
                            {zoom}%
                        </span>
                        <button
                            onClick={handleZoomIn}
                            disabled={zoom >= zoomLevels[zoomLevels.length - 1]}
                            className={`p-1 rounded transition ${textMutedClass} hover:${textHeaderClass} disabled:opacity-30 disabled:cursor-not-allowed`}
                            title="Zoom In"
                        >
                            <ZoomIn size={14} />
                        </button>
                    </div>

                    <button
                        onClick={handleSaveChapterAndPublish}
                        disabled={!hasChanges || isSaving}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-200 shadow-sm
                            ${!hasChanges
                                ? (theme === 'light' ? 'bg-gray-100 text-gray-400' : 'bg-gray-800 text-gray-500')
                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'} 
                            disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        <span>Lưu và đăng tải</span>
                    </button>
                </div>
            </div>

            <div className={`flex-shrink-0 border-b ${theme === 'light' ? 'border-gray-200 bg-white' : 'border-gray-800 bg-gray-900'}`}>
                <EditorToolbar editor={editor} theme={theme} />
            </div>

            <div className={`flex-1 min-h-0 overflow-auto ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-950'} flex justify-center`}>
                <div className="py-8 px-8 min-h-full w-full flex justify-center">
                    <div
                        style={{
                            width: `${21 * (zoom / 100)}cm`,
                            transition: 'width 0.2s',
                            minHeight: `${29.7 * (zoom / 100)}cm`
                        }}
                        className="flex-shrink-0"
                    >
                        <div
                            ref={editorContentRef}
                            className={`origin-top-left transition-transform duration-200 ${theme === 'light' ? 'bg-white shadow-sm' : 'bg-gray-900 shadow-xl shadow-black/20'}`}
                            style={{
                                width: '21cm',
                                minHeight: '29.7cm',
                                transform: `scale(${zoom / 100})`,
                            }}
                        >
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
        </div>
    );
}
