"use client";

import { FileText, ChevronDown, ChevronUp, Plus, Book, SquarePen, Layers, Settings, Trash2, Trash } from 'lucide-react';
import { deleteChapter } from '@/action/chapterActions';
import { notifyError, notifySuccess } from '@/utils/notify';
import { getUserFromCookies } from '@/action/userAction';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import EditChapterPopup from './EditChapterPopup';
import CreateChapterPopup from './CreateChapterPopup';
import CreateActPopup from './CreateActPopup';
import EditActPopup from './EditActPopup';
import DeleteConfirmPopup from './DeleteConfirmPopup';

interface ChapterSidebarProps {
    acts: any[];
    theme: 'light' | 'dark';
    selectedChapterId?: string;
    onSelectChapter: (chapter: any) => void;
    isLoading: boolean;
    novelId: string;
    onUpdate: () => void;
}

export default function ChapterSidebar({ acts, theme, selectedChapterId, onSelectChapter, isLoading, novelId, onUpdate }: ChapterSidebarProps) {
    console.log('ChapterSidebar - novelId:', novelId);
    const [publishedOpen, setPublishedOpen] = useState(true);
    const [draftsOpen, setDraftsOpen] = useState(true);
    const [openActs, setOpenActs] = useState<Record<string, boolean>>({});
    const [isEditChapterOpen, setIsEditChapterOpen] = useState(false);
    const [editChapter, setEditChapter] = useState<any>(null);
    const [isCreatePopupOpen, setIsCreatePopupOpen] = useState(false);
    const [createData, setCreateData] = useState<{ actId: string, type: string } | null>(null);
    const [isCreateActPopupOpen, setIsCreateActPopupOpen] = useState(false);
    const [isEditActPopupOpen, setIsEditActPopupOpen] = useState(false);
    const [editingAct, setEditingAct] = useState<any>(null);
    const [isDeletePopupOpen, setIsDeletePopupOpen] = useState(false);
    const [deletingChapter, setDeletingChapter] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);

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

    const allChapters = acts.flatMap(act => act.chapters || []);
    const allDrafts = acts.flatMap(act => act.drafts || []);
    const totalPublished = allChapters.length;
    const totalDrafts = allDrafts.length;

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
            className={`group w-full text-left hover:cursor-pointer pl-6 pr-3 py-2 rounded-lg ${selectedChapterId === item._id ? selectedClass : hoverClass
                } transition-all duration-150 flex items-center gap-3 border-l-2 ${selectedChapterId === item._id ? 'border-blue-500' : 'border-transparent'}`}
        >
            <div className="flex-1 flex items-center justify-between min-w-0">
                <div className={`text-sm truncate ${selectedChapterId === item._id ? 'font-medium' : textHeaderClass}`}>
                    {`Chương ${item.chapterNumber} - ${item.title}`}
                </div>

                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div
                        className={`p-1 rounded-md hover:cursor-pointer transition-colors ${hoverClass}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            setDeletingChapter(item);
                            setIsDeletePopupOpen(true);
                        }}
                        title="Xóa chương"
                    >
                        <Trash size={15} strokeWidth={2} className="text-red-400 hover:text-red-500" />
                    </div>
                    <div
                        className={`ml-1 p-1 rounded-md hover:cursor-pointer transition-colors ${hoverClass}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleEditChapter(item);
                        }}
                        title="Sửa chương"
                    >
                        <SquarePen size={15} strokeWidth={2} className={textMutedClass} />
                    </div>
                </div>
            </div>
        </motion.button>
    );

    const ActSection = ({ act, chapters, type, onAdd }: { act: any; chapters: any[]; type: 'published' | 'draft'; onAdd: (actId: string, type: string) => void }) => {
        const actId = `${type}-${act._id}`;
        const isOpen = isActOpen(actId);

        // if (chapters.length === 0) return null;

        return (
            <div className="rounded-lg overflow-hidden mb-1">
                <div
                    className={`group w-full px-3 py-2 flex items-center justify-between ${hoverClass} transition-colors rounded-lg cursor-pointer`}
                    onClick={() => toggleAct(actId)}
                >
                    <div className="flex items-center gap-2 overflow-hidden">
                        <div className={`shrink-0 w-6 h-6 rounded-md flex items-center justify-center ${theme === 'light' ? 'bg-purple-100' : 'bg-purple-900/30'}`}>
                            <Book size={14} className={theme === 'light' ? 'text-purple-600' : 'text-purple-400'} />
                        </div>
                        <span className={`text-sm mt-0.5 font-semibold truncate ${textHeaderClass}`}>
                            {`${act.actType === '' ? 'Act' : act.actType} ${act.actNumber} - ${act.title || ''}`}
                        </span>
                        {/* <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded ${theme === 'light' ? 'bg-gray-200 text-gray-600' : 'bg-gray-700 text-gray-400'}`}>
                            {chapters.length}
                        </span> */}
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleEditAct(act);
                            }}
                            className={`
                                opacity-0 group-hover:opacity-100 transition-opacity
                                p-1 rounded-md hover:cursor-pointer
                                ${theme === 'light' ? 'hover:bg-gray-200 text-gray-400 hover:text-gray-600' : 'hover:bg-gray-700 text-gray-500 hover:text-gray-300'}
                            `}
                            title="Sửa thông tin Hồi"
                        >
                            <Settings size={14} />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onAdd(act._id, type);
                            }}
                            className={`
                                opacity-0 group-hover:opacity-100 transition-opacity
                                p-1 rounded-md hover:cursor-pointer
                                ${theme === 'light' ? 'hover:bg-gray-200 text-gray-500 hover:text-blue-600' : 'hover:bg-gray-700 text-gray-400 hover:text-blue-400'}
                            `}
                            title={type === 'published' ? 'Thêm chương mới' : 'Thêm bản nháp'}
                        >
                            <Plus size={16} />
                        </button>
                        <motion.div
                            animate={{ rotate: isOpen ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                            className="shrink-0"
                        >
                            <ChevronDown size={14} className={textMutedClass} />
                        </motion.div>
                    </div>
                </div>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            variants={contentVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="pl-2 pb-2 mt-1"
                        >
                            <div className="space-y-0.5 border-l border-gray-200 dark:border-gray-800 ml-3 pl-2">
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

    const handleAddChapter = (actId: string, type: string) => {
        setCreateData({ actId, type });
        setIsCreatePopupOpen(true);
    };

    const handleEditAct = (act: any) => {
        setEditingAct(act);
        setIsEditActPopupOpen(true);
    };

    const handleEditChapter = (chapter: any) => {
        setIsEditChapterOpen(true);
        setEditChapter(chapter);
    };

    const handleDeleteConfirm = async () => {
        if (!deletingChapter) return;
        setIsDeleting(true);
        try {
            const user = await getUserFromCookies();
            if (!user) {
                notifyError('Vui lòng đăng nhập!');
                return;
            }

            await deleteChapter({
                actId: deletingChapter.actId,
                userId: user.user._id,
                novelId,
                chapterId: deletingChapter._id
            });
            notifySuccess('Xóa chương thành công!');
            onUpdate();
            setIsDeletePopupOpen(false);
            setDeletingChapter(null);

            // If deleted chapter was selected, deselect it
            if (selectedChapterId === deletingChapter._id) {
                onSelectChapter(null as any);
            }
        } catch (error: any) {
            console.error('Error deleting chapter:', error);
            notifyError(error?.message || 'Xóa chương thất bại!');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="w-80 flex flex-col gap-4 h-full">
            {isLoading ? (
                <div className={`${cardClass} p-8 text-center ${textMutedClass}`}>
                    <div className="animate-pulse flex flex-col items-center gap-3">
                        <div className={`h-4 w-24 rounded ${theme === 'light' ? 'bg-gray-200' : 'bg-gray-800'}`}></div>
                        <div className={`h-3 w-16 rounded ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'}`}></div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-4 overflow-y-auto pb-4 custom-scrollbar flex-1 min-h-0">
                    {/* Add Act Button */}
                    <button
                        onClick={() => setIsCreateActPopupOpen(true)}
                        className={`w-full py-3 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 group transition-all ${theme === 'light'
                            ? 'border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-gray-500 hover:text-blue-600'
                            : 'border-gray-700 hover:border-blue-500 hover:bg-blue-900/20 text-gray-400 hover:text-blue-400'
                            }`}
                    >
                        <Layers size={18} />
                        <span className="font-semibold text-sm">Thêm Hồi Mới</span>
                    </button>

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
                                    className="p-3 pt-0 space-y-2 max-h-[40vh] overflow-y-auto custom-scrollbar"
                                >
                                    {acts.map((actData, index) => {
                                        if (!actData?.act) return null;
                                        return (
                                            <ActSection
                                                key={actData.act._id || index}
                                                act={actData.act}
                                                chapters={actData.chapters || []}
                                                type="published"
                                                onAdd={handleAddChapter}
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
                                    className="p-3 pt-0 space-y-2 max-h-[40vh] overflow-y-auto custom-scrollbar"
                                >
                                    {acts.map((actData, index) => {
                                        if (!actData?.act) return null;
                                        return (
                                            <ActSection
                                                key={actData.act._id || index}
                                                act={actData.act}
                                                chapters={actData.drafts || []}
                                                type="draft"
                                                onAdd={handleAddChapter}
                                            />
                                        );
                                    })}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            )}

            {isEditChapterOpen && editChapter && (
                <EditChapterPopup
                    novelId={novelId}
                    actId={editChapter.actId}
                    isOpen={isEditChapterOpen}
                    onClose={() => setIsEditChapterOpen(false)}
                    chapter={editChapter}
                    theme={theme}
                    onUpdate={onUpdate}
                />
            )}

            {isCreatePopupOpen && createData && (
                <CreateChapterPopup
                    novelId={novelId}
                    actId={createData.actId}
                    type={createData.type}
                    isOpen={isCreatePopupOpen}
                    onClose={() => setIsCreatePopupOpen(false)}
                    theme={theme}
                    onUpdate={onUpdate}
                />
            )}

            {isCreateActPopupOpen && (
                <CreateActPopup
                    novelId={novelId}
                    isOpen={isCreateActPopupOpen}
                    onClose={() => setIsCreateActPopupOpen(false)}
                    theme={theme}
                    onUpdate={onUpdate}
                />
            )}

            {isEditActPopupOpen && editingAct && (
                <EditActPopup
                    novelId={novelId}
                    act={editingAct}
                    isOpen={isEditActPopupOpen}
                    onClose={() => setIsEditActPopupOpen(false)}
                    theme={theme}
                    onUpdate={onUpdate}
                />
            )}
            {isDeletePopupOpen && (
                <DeleteConfirmPopup
                    isOpen={isDeletePopupOpen}
                    onClose={() => setIsDeletePopupOpen(false)}
                    onConfirm={handleDeleteConfirm}
                    title="Xóa Chương"
                    message={`Bạn có chắc chắn muốn xóa "Chương ${deletingChapter?.chapterNumber} - ${deletingChapter?.title || ''}"? Hành động này không thể hoàn tác.`}
                    isPending={isDeleting}
                    theme={theme}
                />
            )}
        </div>
    );
}
