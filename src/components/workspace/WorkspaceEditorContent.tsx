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
import { useEffect } from 'react';

interface WorkspaceEditorContentProps {
    content: string;
    onChange: (html: string) => void;
    placeholder?: string;
    minHeight?: string;
    theme: 'light' | 'dark';
    onEditorReady?: (editor: any) => void;
}

export default function WorkspaceEditorContent({
    content,
    onChange,
    placeholder = "Bắt đầu viết...",
    minHeight = "300px",
    theme,
    onEditorReady
}: WorkspaceEditorContentProps) {
    const editorText = theme === 'light' ? 'text-gray-900' : 'text-gray-100';
    const editorBg = theme === 'light' ? 'bg-white' : 'bg-gray-900';
    const proseClass = theme === 'light' ? 'prose' : 'prose-invert';

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
                class: `${proseClass} max-w-none focus:outline-none`,
                style: `min-height: ${minHeight}; padding: 2cm 2.5cm;`,
            },
        },
    });

    useEffect(() => {
        if (editor && onEditorReady) {
            onEditorReady(editor);
        }
    }, [editor, onEditorReady]);

    if (!editor) return null;

    return (
        <>
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
            <EditorContent editor={editor} className={`${editorBg} ${editorText}`} />
        </>
    );
}
