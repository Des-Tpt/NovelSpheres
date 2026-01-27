"use client";

import { FileText, ChevronDown, ChevronUp, Plus, Book } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChapterSidebarProps {
    acts: any[];
    theme: 'light' | 'dark';
    selectedChapterId?: string;
    onSelectChapter: (chapter: any) => void;
    isLoading: boolean;
}

export default function ChapterSidebar({ acts, theme, selectedChapterId, onSelectChapter, isLoading }: ChapterSidebarProps) {
    const [publishedOpen, setPublishedOpen] = useState(true);
    const [draftsOpen, setDraftsOpen] = useState(true);
    const [openActs, setOpenActs] = useState<Record<string, boolean>>({});

    const toggleAct = (actId: string) => {
        setOpenActs(prev => ({ ...prev, [actId]: !prev[actId] }));
    };

    const isActOpen = (actId: string) => openActs[actId] !== false;

    const cardBg = theme === 'light' ? 'bg-white' : 'bg-gray-900';
    const cardBorder = theme === 'light' ? 'border border-gray-200' : 'border border-gray-800';
    const cardShadow = theme === 'light' ? 'shadow-sm' : 'shadow-sm shadow-gray-900/50';
    const cardClass = `${cardBg} ${cardBorder} ${cardShadow} rounded-xl overflow-hidden`;

    const hoverClass = theme === 'light' ? 'hover:bg-gray-50' : 'hover:bg-gray-800';
    const selectedClass = theme === 'light' ? 'bg-blue-50 text-blue-600' : 'bg-blue-900/20 text-blue-400';
    const textMutedClass = theme === 'light' ? 'text-gray-500' : 'text-gray-400';
    const textHeaderClass = theme === 'light' ? 'text-gray-900' : 'text-gray-100';
    const actBgClass = theme === 'light' ? 'bg-gray-50' : 'bg-gray-800/50';

    const allChapters = acts.flatMap(act => act.chapters || []);
    const allDrafts = acts.flatMap(act => act.drafts || []);
    const totalPublished = allChapters.length;
    const totalDrafts = allDrafts.length;
    const publishedWords = allChapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0);
    const draftWords = allDrafts.reduce((sum, dr) => sum + (dr.wordCount || 0), 0);

    // Animation variants
    const contentVariants = {
        hidden: { opacity: 0, height: 0 },
        visible: { opacity: 1, height: 'auto', transition: { duration: 0.2, ease: 'easeOut' as const } },
        exit: { opacity: 0, height: 0, transition: { duration: 0.15, ease: 'easeIn' as const } }
    };

    const ChapterItem = ({ item, isDraft = false }: { item: any; isDraft?: boolean }) => (
        <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            key={item._id}
            onClick={() => onSelectChapter(item)}
            className={`w-full text-left pl-6 pr-3 py-2 rounded-lg ${selectedChapterId === item._id ? selectedClass : hoverClass
                } transition-all duration-150 flex items-center gap-3 border-l-2 ${selectedChapterId === item._id ? 'border-blue-500' : 'border-transparent'}`}
        >
            <div className="flex-1 min-w-0">
                <div className={`text-sm truncate ${selectedChapterId === item._id ? 'font-medium' : textHeaderClass}`}>
                    {`Chương ${item.chapterNumber} - ${item.title}`}
                </div>
            </div>
        </motion.button>
    );

    const ActSection = ({ act, chapters, type }: { act: any; chapters: any[]; type: 'published' | 'draft' }) => {
        const actId = `${type}-${act._id}`;
        const isOpen = isActOpen(actId);

        if (chapters.length === 0) return null;

        return (
            <div className="rounded-lg overflow-hidden">
                <button
                    onClick={() => toggleAct(actId)}
                    className={`w-full px-3 py-2.5 flex items-center justify-between ${hoverClass} transition-colors rounded-lg`}
                >
                    <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center ${theme === 'light' ? 'bg-purple-100' : 'bg-purple-900/30'}`}>
                            <Book size={14} className={theme === 'light' ? 'text-purple-600' : 'text-purple-400'} />
                        </div>
                        <span className={`text-sm font-semibold ${textHeaderClass}`}>
                            {act.title || `Hồi ${act.actNumber || ''}`}
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${theme === 'light' ? 'bg-gray-200 text-gray-600' : 'bg-gray-700 text-gray-400'}`}>
                            {chapters.length}
                        </span>
                    </div>
                    <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChevronDown size={14} className={textMutedClass} />
                    </motion.div>
                </button>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            variants={contentVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="pl-2 pb-2"
                        >
                            <div className="space-y-0.5">
                                {chapters.map((ch) => (
                                    <ChapterItem key={ch._id} item={ch} isDraft={type === 'draft'} />
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    return (
        <div className="w-80 flex flex-col gap-4 h-full">
            {/* Create Chapter Card */}
            <div className={`${cardClass} p-4 transition-all duration-200 hover:shadow-md`}>
                <button className={`w-full hover:cursor-pointer flex items-center justify-center gap-2 px-4 py-3 border border-dashed ${theme === 'light' ? 'border-gray-300 hover:border-blue-400 hover:bg-blue-50' : 'border-gray-700 hover:border-blue-500 hover:bg-blue-900/10'} rounded-lg transition-all duration-200 group`}>
                    <Plus size={20} className="text-blue-500 group-hover:scale-110 transition-transform" />
                    <span className={`font-medium ${theme === 'light' ? 'text-blue-600' : 'text-blue-400'}`}>Tạo chương mới</span>
                </button>
            </div>

            {isLoading ? (
                <div className={`${cardClass} p-8 text-center ${textMutedClass}`}>
                    <div className="animate-pulse flex flex-col items-center gap-3">
                        <div className={`h-4 w-24 rounded ${theme === 'light' ? 'bg-gray-200' : 'bg-gray-800'}`}></div>
                        <div className={`h-3 w-16 rounded ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'}`}></div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-4 overflow-y-auto pb-4 custom-scrollbar">
                    {/* Published Section Card */}
                    <div className={`${cardClass}`}>
                        <button
                            onClick={() => setPublishedOpen(!publishedOpen)}
                            className={`w-full px-5 py-4 flex items-center justify-between ${hoverClass} transition-colors`}
                        >
                            <div className="flex items-center gap-3">
                                <span className={`text-base font-semibold ${textHeaderClass}`}>Đã đăng</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${theme === 'light' ? 'bg-blue-100 text-blue-700' : 'bg-blue-900/40 text-blue-300'}`}>
                                    {totalPublished}
                                </span>
                            </div>
                            <motion.div
                                animate={{ rotate: publishedOpen ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <ChevronDown size={18} className={textMutedClass} />
                            </motion.div>
                        </button>

                        <AnimatePresence>
                            {publishedOpen && (
                                <motion.div
                                    variants={contentVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    className="p-3 pt-0 space-y-2"
                                >
                                    {acts.map((actData, index) => {
                                        if (!actData?.act) return null;
                                        return (
                                            <ActSection
                                                key={actData.act._id || index}
                                                act={actData.act}
                                                chapters={actData.chapters || []}
                                                type="published"
                                            />
                                        );
                                    })}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Drafts Section Card */}
                    <div className={`${cardClass}`}>
                        <button
                            onClick={() => setDraftsOpen(!draftsOpen)}
                            className={`w-full px-5 py-4 flex items-center justify-between ${hoverClass} transition-colors`}
                        >
                            <div className="flex items-center gap-3">
                                <span className={`text-base font-semibold ${textHeaderClass}`}>Bản nháp</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${theme === 'light' ? 'bg-gray-100 text-gray-700' : 'bg-gray-800 text-gray-300'}`}>
                                    {totalDrafts}
                                </span>
                            </div>
                            <motion.div
                                animate={{ rotate: draftsOpen ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <ChevronDown size={18} className={textMutedClass} />
                            </motion.div>
                        </button>

                        <AnimatePresence>
                            {draftsOpen && (
                                <motion.div
                                    variants={contentVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    className="p-3 pt-0 space-y-2"
                                >
                                    {acts.map((actData, index) => {
                                        if (!actData?.act) return null;
                                        return (
                                            <ActSection
                                                key={actData.act._id || index}
                                                act={actData.act}
                                                chapters={actData.drafts || []}
                                                type="draft"
                                            />
                                        );
                                    })}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            )}
        </div>
    );
}
