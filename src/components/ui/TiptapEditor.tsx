"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import {
    Bold, Italic, Strikethrough, Code, List, ListOrdered,
    Quote, Undo, Redo, Link2, Highlighter, AlignLeft,
    AlignCenter, AlignRight, AlignJustify, Underline as UnderlineIcon
} from 'lucide-react';
import { useCallback } from 'react';

interface TiptapEditorProps {
    content: string;
    onChange: (html: string) => void;
    placeholder?: string;
    minHeight?: string;
}

const TiptapEditor: React.FC<TiptapEditorProps> = ({
    content,
    onChange,
    placeholder = "Bắt đầu viết...",
    minHeight = "300px"
}) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3, 4, 5, 6],
                },
            }),
            Placeholder.configure({
                placeholder,
            }),
            Underline,
            TextAlign.configure({
                types: ['heading', 'paragraph', 'listItem'],
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-blue-500 hover:underline',
                },
            }),
            Highlight.configure({
                multicolor: true,
            }),
            TextStyle,
            Color,
            FontFamily,
        ],
        immediatelyRender: false,
        content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-invert max-w-none focus:outline-none px-4 py-3',
                style: `min-height: ${minHeight}`,
            },
        },
    });

    const setLink = useCallback(() => {
        if (!editor) return;

        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL:', previousUrl);

        if (url === null) return;

        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }

        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }, [editor]);

    if (!editor) return null;

    return (
        <div className="border border-gray-700 rounded-lg bg-gray-900 overflow-hidden">
            {/* Toolbar */}
            <div className="bg-gray-800 border-b border-gray-700 p-2 flex flex-wrap gap-1">
                {/* Text Style */}
                <button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`p-2 rounded hover:bg-gray-700 transition ${editor.isActive('bold') ? 'bg-gray-700 text-blue-400' : 'text-gray-300'}`}
                    type="button"
                    title="Bold (Ctrl+B)"
                >
                    <Bold size={18} />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`p-2 rounded hover:bg-gray-700 transition ${editor.isActive('italic') ? 'bg-gray-700 text-blue-400' : 'text-gray-300'}`}
                    type="button"
                    title="Italic (Ctrl+I)"
                >
                    <Italic size={18} />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    className={`p-2 rounded hover:bg-gray-700 transition ${editor.isActive('underline') ? 'bg-gray-700 text-blue-400' : 'text-gray-300'}`}
                    type="button"
                    title="Underline (Ctrl+U)"
                >
                    <UnderlineIcon size={18} />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    className={`p-2 rounded hover:bg-gray-700 transition ${editor.isActive('strike') ? 'bg-gray-700 text-blue-400' : 'text-gray-300'}`}
                    type="button"
                    title="Strikethrough"
                >
                    <Strikethrough size={18} />
                </button>

                <div className="w-px h-6 bg-gray-600 mx-1" />

                {/* Headings */}
                {[1, 2, 3].map((level) => (
                    <button
                        key={level}
                        onClick={() => editor.chain().focus().toggleHeading({ level: level as any }).run()}
                        className={`px-2 py-1 rounded hover:bg-gray-700 transition text-sm font-semibold ${editor.isActive('heading', { level }) ? 'bg-gray-700 text-blue-400' : 'text-gray-300'
                            }`}
                        type="button"
                        title={`Heading ${level}`}
                    >
                        H{level}
                    </button>
                ))}

                <div className="w-px h-6 bg-gray-600 mx-1" />

                {/* Lists */}
                <button
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`p-2 rounded hover:bg-gray-700 transition ${editor.isActive('bulletList') ? 'bg-gray-700 text-blue-400' : 'text-gray-300'}`}
                    type="button"
                    title="Bullet List"
                >
                    <List size={18} />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={`p-2 rounded hover:bg-gray-700 transition ${editor.isActive('orderedList') ? 'bg-gray-700 text-blue-400' : 'text-gray-300'}`}
                    type="button"
                    title="Numbered List"
                >
                    <ListOrdered size={18} />
                </button>

                <div className="w-px h-6 bg-gray-600 mx-1" />

                {/* Alignment */}
                <button
                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                    className={`p-2 rounded hover:bg-gray-700 transition ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-700 text-blue-400' : 'text-gray-300'}`}
                    type="button"
                    title="Align Left"
                >
                    <AlignLeft size={18} />
                </button>
                <button
                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                    className={`p-2 rounded hover:bg-gray-700 transition ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-700 text-blue-400' : 'text-gray-300'}`}
                    type="button"
                    title="Align Center"
                >
                    <AlignCenter size={18} />
                </button>
                <button
                    onClick={() => editor.chain().focus().setTextAlign('right').run()}
                    className={`p-2 rounded hover:bg-gray-700 transition ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-700 text-blue-400' : 'text-gray-300'}`}
                    type="button"
                    title="Align Right"
                >
                    <AlignRight size={18} />
                </button>
                <button
                    onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                    className={`p-2 rounded hover:bg-gray-700 transition ${editor.isActive({ textAlign: 'justify' }) ? 'bg-gray-700 text-blue-400' : 'text-gray-300'}`}
                    type="button"
                    title="Align Justify"
                >
                    <AlignJustify size={18} />
                </button>

                <div className="w-px h-6 bg-gray-600 mx-1" />

                {/* Other */}
                <button
                    onClick={setLink}
                    className={`p-2 rounded hover:bg-gray-700 transition ${editor.isActive('link') ? 'bg-gray-700 text-blue-400' : 'text-gray-300'}`}
                    type="button"
                    title="Insert Link"
                >
                    <Link2 size={18} />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleHighlight().run()}
                    className={`p-2 rounded hover:bg-gray-700 transition ${editor.isActive('highlight') ? 'bg-gray-700 text-blue-400' : 'text-gray-300'}`}
                    type="button"
                    title="Highlight"
                >
                    <Highlighter size={18} />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    className={`p-2 rounded hover:bg-gray-700 transition ${editor.isActive('blockquote') ? 'bg-gray-700 text-blue-400' : 'text-gray-300'}`}
                    type="button"
                    title="Quote"
                >
                    <Quote size={18} />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    className={`p-2 rounded hover:bg-gray-700 transition ${editor.isActive('code') ? 'bg-gray-700 text-blue-400' : 'text-gray-300'}`}
                    type="button"
                    title="Inline Code"
                >
                    <Code size={18} />
                </button>

                <div className="w-px h-6 bg-gray-600 mx-1" />

                {/* Undo/Redo */}
                <button
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                    className="p-2 rounded hover:bg-gray-700 transition text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                    type="button"
                    title="Undo (Ctrl+Z)"
                >
                    <Undo size={18} />
                </button>
                <button
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                    className="p-2 rounded hover:bg-gray-700 transition text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                    type="button"
                    title="Redo (Ctrl+Y)"
                >
                    <Redo size={18} />
                </button>
            </div>

            {/* Editor Content */}
            <style>{`
                .ProseMirror ul {
                    list-style-type: disc;
                    padding-left: 1.5rem;
                }
                .ProseMirror ol {
                    list-style-type: decimal;
                    padding-left: 1.5rem;
                }
                .ProseMirror ul ul {
                    list-style-type: circle;
                }
                .ProseMirror ol ol {
                    list-style-type: lower-alpha;
                }
                .ProseMirror li {
                    display: list-item;
                }
                .ProseMirror p {
                    margin: 0.5rem 0;
                }
            `}</style>
            <EditorContent editor={editor} className="bg-gray-900 text-gray-100" />
        </div>
    );
};

export default TiptapEditor;
