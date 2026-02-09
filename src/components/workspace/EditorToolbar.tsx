"use client";

import {
    Bold, Italic, Strikethrough, Code, List, ListOrdered,
    Quote, Undo, Redo, Link2, Highlighter, AlignLeft,
    AlignCenter, AlignRight, AlignJustify, Underline as UnderlineIcon
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Editor } from '@tiptap/react';

interface EditorToolbarProps {
    editor: Editor | null;
    theme: 'light' | 'dark';
}

export default function EditorToolbar({ editor, theme }: EditorToolbarProps) {
    const [, forceUpdate] = useState({});
    const [showFontDropdown, setShowFontDropdown] = useState(false);

    // Force re-render when editor selection changes to update button states
    useEffect(() => {
        if (!editor) return;

        const updateHandler = () => forceUpdate({});
        editor.on('selectionUpdate', updateHandler);
        editor.on('transaction', updateHandler);

        return () => {
            editor.off('selectionUpdate', updateHandler);
            editor.off('transaction', updateHandler);
        };
    }, [editor]);

    if (!editor) return null;

    const toolbarBg = theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-gray-800 border-gray-700';
    const buttonHover = theme === 'light' ? 'hover:bg-gray-200' : 'hover:bg-gray-700';
    const buttonActive = theme === 'light' ? 'bg-gray-200 text-blue-600' : 'bg-gray-700 text-blue-400';
    const buttonText = theme === 'light' ? 'text-gray-700' : 'text-gray-300';

    const fonts = [
        { name: 'Arial', value: 'Arial, sans-serif' },
        { name: 'Times New Roman', value: 'Times New Roman, serif' },
        { name: 'Courier New', value: 'Courier New, monospace' },
        { name: 'Georgia', value: 'Georgia, serif' },
        { name: 'Verdana', value: 'Verdana, sans-serif' },
        { name: 'Comic Sans MS', value: 'Comic Sans MS, cursive' },
    ];

    const getCurrentFont = () => {
        const fontFamily = editor.getAttributes('textStyle').fontFamily;
        const found = fonts.find(f => f.value === fontFamily);
        return found?.value || 'Arial, sans-serif';
    };

    const handleFontChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const fontValue = e.target.value;
        if (fontValue) {
            editor.chain().focus().setFontFamily(fontValue).run();
        }
    };

    const ToolbarButton = ({ onClick, isActive, title, icon: Icon }: any) => (
        <button
            onClick={onClick}
            className={`p-2 rounded transition ${isActive ? buttonActive : `${buttonText} ${buttonHover}`}`}
            type="button"
            title={title}
        >
            <Icon size={18} />
        </button>
    );

    const HeadingButton = ({ level }: { level: 1 | 2 | 3 }) => {
        const isActive = editor.isActive('heading', { level });
        return (
            <button
                onClick={(e) => {
                    e.preventDefault();
                    if (isActive) {
                        // If heading is active, toggle back to paragraph
                        editor.chain().focus().setParagraph().run();
                    } else {
                        // Otherwise set to heading
                        editor.chain().focus().setHeading({ level }).run();
                    }
                }}
                className={`px-2 py-1 rounded transition text-sm font-semibold ${isActive ? buttonActive : `${buttonText} ${buttonHover}`
                    }`}
                type="button"
                title={`Heading ${level}`}
            >
                H{level}
            </button>
        );
    };

    const setLink = () => {
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL:', previousUrl);

        if (url === null) return;

        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }

        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };

    return (
        <div className={`${toolbarBg} border-b p-2 flex flex-wrap gap-1 shrink-0`}>
            <div className="relative w-1">
                <button
                    onClick={() => setShowFontDropdown(!showFontDropdown)}
                    className={`h-9 px-3 rounded transition text-sm ${buttonText} ${buttonHover} ${theme === 'light' ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-600'} border flex items-center gap-2 w-40 justify-between`}
                    type="button"
                >
                    <span>{fonts.find(f => f.value === getCurrentFont())?.name || 'Arial'}</span>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                        <path d="M6 8L2 4h8z" />
                    </svg>
                </button>
                {showFontDropdown && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowFontDropdown(false)} />
                        <div className={`absolute top-full left-0 mt-1 ${theme === 'light' ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-600'} border rounded shadow-lg z-20 w-40 max-h-48 overflow-y-auto`}>
                            {fonts.map(font => (
                                <button
                                    key={font.value}
                                    onClick={() => {
                                        handleFontChange({ target: { value: font.value } } as any);
                                        setShowFontDropdown(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 text-sm ${buttonHover} transition`}
                                    style={{ fontFamily: font.value }}
                                >
                                    {font.name}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>

            <div className={`w-px h-8 ${theme === 'light' ? 'bg-gray-300' : 'bg-gray-600'} mx-1`} />

            {/* Text Style */}
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleBold().run()}
                isActive={editor.isActive('bold')}
                title="Bold (Ctrl+B)"
                icon={Bold}
            />
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleItalic().run()}
                isActive={editor.isActive('italic')}
                title="Italic (Ctrl+I)"
                icon={Italic}
            />
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                isActive={editor.isActive('underline')}
                title="Underline (Ctrl+U)"
                icon={UnderlineIcon}
            />
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleStrike().run()}
                isActive={editor.isActive('strike')}
                title="Strikethrough"
                icon={Strikethrough}
            />

            <div className={`w-px h-8 ${theme === 'light' ? 'bg-gray-300' : 'bg-gray-600'} mx-1`} />

            {/* Headings - Hidden */}
            {/* <HeadingButton level={1} />
            <HeadingButton level={2} />
            <HeadingButton level={3} /> */}

            {/* <div className={`w-px h-6 ${theme === 'light' ? 'bg-gray-300' : 'bg-gray-600'} mx-1`} /> */}

            {/* Lists */}
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                isActive={editor.isActive('bulletList')}
                title="Bullet List"
                icon={List}
            />
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                isActive={editor.isActive('orderedList')}
                title="Numbered List"
                icon={ListOrdered}
            />

            <div className={`w-px h-8 ${theme === 'light' ? 'bg-gray-300' : 'bg-gray-600'} mx-1`} />

            {/* Alignment */}
            <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                isActive={editor.isActive({ textAlign: 'left' })}
                title="Align Left"
                icon={AlignLeft}
            />
            <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                isActive={editor.isActive({ textAlign: 'center' })}
                title="Align Center"
                icon={AlignCenter}
            />
            <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                isActive={editor.isActive({ textAlign: 'right' })}
                title="Align Right"
                icon={AlignRight}
            />
            <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                isActive={editor.isActive({ textAlign: 'justify' })}
                title="Align Justify"
                icon={AlignJustify}
            />

            <div className={`w-px h-8 ${theme === 'light' ? 'bg-gray-300' : 'bg-gray-600'} mx-1`} />

            {/* Other */}
            <ToolbarButton
                onClick={setLink}
                isActive={editor.isActive('link')}
                title="Insert Link"
                icon={Link2}
            />
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleHighlight().run()}
                isActive={editor.isActive('highlight')}
                title="Highlight"
                icon={Highlighter}
            />
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                isActive={editor.isActive('blockquote')}
                title="Quote"
                icon={Quote}
            />
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleCode().run()}
                isActive={editor.isActive('code')}
                title="Inline Code"
                icon={Code}
            />

            <div className={`w-px h-8 ${theme === 'light' ? 'bg-gray-300' : 'bg-gray-600'} mx-1`} />

            {/* Undo/Redo */}
            <button
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                className={`p-2 rounded transition ${buttonText} ${buttonHover} disabled:opacity-30 disabled:cursor-not-allowed`}
                type="button"
                title="Undo (Ctrl+Z)"
            >
                <Undo size={18} />
            </button>
            <button
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                className={`p-2 rounded transition ${buttonText} ${buttonHover} disabled:opacity-30 disabled:cursor-not-allowed`}
                type="button"
                title="Redo (Ctrl+Y)"
            >
                <Redo size={18} />
            </button>
        </div>
    );
}
