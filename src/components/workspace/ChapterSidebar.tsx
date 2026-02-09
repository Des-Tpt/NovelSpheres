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

const contentVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: { opacity: 1, height: 'auto', transition: { duration: 0.2, ease: 'easeOut' as const } },
    exit: { opacity: 0, height: 0, transition: { duration: 0.15, ease: 'easeIn' as const } }
};

const ChapterItem = ({
    item,
    isDraft = false,
    selectedChapterId,
    onSelectChapter,
    theme,
    onDelete,
    onEdit
}: {
    item: any;
    isDraft?: boolean;
    selectedChapterId?: string;
    onSelectChapter: (item: any) => void;
    theme: 'light' | 'dark';
    onDelete: (item: any) => void;
    onEdit: (item: any) => void;
}) => {
    const hoverClass = theme === 'light' ? 'hover:bg-gray-50' : 'hover:bg-gray-800';
    const selectedClass = theme === 'light' ? 'bg-blue-50 text-blue-600' : 'bg-blue-900/20 text-blue-400';
    const textHeaderClass = theme === 'light' ? 'text-gray-900' : 'text-gray-100';
    const textMutedClass = theme === 'light' ? 'text-gray-500' : 'text-gray-400';

    return (
        <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            key={item._id}
            onClick={() => onSelectChapter(item)}
            className={`group w-full text-left hover:cursor-pointer pl-6 pr-3 py-2 rounded-lg ${selectedChapterId === item._id ? selectedClass : hoverClass
                } transition-colors duration-150 flex items-center gap-3 border-l-2 ${selectedChapterId === item._id ? 'border-blue-500' : 'border-transparent'}`}
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
                            onDelete(item);
                        }}
                        title="Xóa chương"
                    >
                        <Trash size={15} strokeWidth={2} className="text-red-400 hover:text-red-500" />
                    </div>
                    <div
                        className={`ml-1 p-1 rounded-md hover:cursor-pointer transition-colors ${hoverClass}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(item);
                        }}
                        title="Sửa chương"
                    >
                        <SquarePen size={15} strokeWidth={2} className={textMutedClass} />
                    </div>
                </div>
            </div>
        </motion.button>
    );
};

const ActSection = ({
    act,
    chapters,
    type,
    onAdd,
    isOpen,
    onToggle,
    theme,
    selectedChapterId,
    onSelectChapter,
    onEditAct,
    onDeleteChapter,
    onEditChapter
}: {
    act: any;
    chapters: any[];
    type: 'published' | 'draft';
    onAdd: (actId: string, type: string) => void;
    isOpen: boolean;
    onToggle: (actId: string) => void;
    theme: 'light' | 'dark';
    selectedChapterId?: string;
    onSelectChapter: (item: any) => void;
    onEditAct: (act: any) => void;
    onDeleteChapter: (item: any) => void;
    onEditChapter: (item: any) => void;
}) => {
    const actId = `${type}-${act._id}`;
    const hoverClass = theme === 'light' ? 'hover:bg-gray-50' : 'hover:bg-gray-800';
    const textHeaderClass = theme === 'light' ? 'text-gray-900' : 'text-gray-100';
    const textMutedClass = theme === 'light' ? 'text-gray-500' : 'text-gray-400';

    return (
        <div className="rounded-lg overflow-hidden mb-1">
            <div
                className={`group w-full px-3 py-2 flex items-center justify-between ${hoverClass} transition-colors rounded-lg cursor-pointer`}
                onClick={() => onToggle(actId)}
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    <div className={`shrink-0 w-6 h-6 rounded-md flex items-center justify-center ${theme === 'light' ? 'bg-purple-100' : 'bg-purple-900/30'}`}>
                        <Book size={14} className={theme === 'light' ? 'text-purple-600' : 'text-purple-400'} />
                    </div>
                    <span className={`text-sm mt-0.5 font-semibold truncate ${textHeaderClass}`}>
                        {`${act.actType === '' ? 'Act' : act.actType} ${act.actNumber} - ${act.title || ''}`}
                    </span>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onEditAct(act);
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
                                <ChapterItem
                                    key={ch._id}
                                    item={ch}
                                    isDraft={type === 'draft'}
                                    selectedChapterId={selectedChapterId}
                                    onSelectChapter={onSelectChapter}
                                    theme={theme}
                                    onDelete={onDeleteChapter}
                                    onEdit={onEditChapter}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default function ChapterSidebar({ acts, theme, selectedChapterId, onSelectChapter, isLoading, novelId, onUpdate }: ChapterSidebarProps) {
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

    const hoverClass = theme === 'light' ? 'hover:bg-gray-50' : 'hover:bg-gray-800';
    const textMutedClass = theme === 'light' ? 'text-gray-500' : 'text-gray-400';
    const textHeaderClass = theme === 'light' ? 'text-gray-900' : 'text-gray-100';

    const allChapters = acts.flatMap(act => act.chapters || []);
    const allDrafts = acts.flatMap(act => act.drafts || []);
    const totalPublished = allChapters.length;
    const totalDrafts = allDrafts.length;

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

            if (selectedChapterId === deletingChapter._id) {
                onSelectChapter(null as any);
            }
        } catch (error: any) {
            notifyError(error?.message || 'Xóa chương thất bại!');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="w-full flex flex-col h-full">
            {isLoading ? (
                <div className={`flex items-center justify-center p-8 ${textMutedClass} h-full`}>
                    <div className="animate-pulse flex flex-col items-center gap-3">
                        <div className={`h-4 w-24 rounded ${theme === 'light' ? 'bg-gray-200' : 'bg-gray-800'}`}></div>
                        <div className={`h-3 w-16 rounded ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'}`}></div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col h-full">
                    <div className={`flex-shrink-0 p-2 border-b ${theme === 'light' ? 'border-gray-200' : 'border-gray-800'}`}>
                        <button
                            onClick={() => setIsCreateActPopupOpen(true)}
                            className={`w-full py-1.5 px-3 rounded text-sm flex items-center justify-center gap-2 transition-colors ${theme === 'light'
                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                                }`}
                        >
                            <Plus size={14} strokeWidth={2.5} />
                            <span className="font-medium">Thêm Hồi Mới</span>
                        </button>
                    </div>

                    <div
                        className="flex-1 overflow-y-auto custom-scrollbar"
                        style={{ scrollbarGutter: 'stable' }}
                    >
                        <div className="">
                            <button
                                onClick={() => setPublishedOpen(!publishedOpen)}
                                className={`w-full px-3 py-2 flex items-center justify-between ${hoverClass} transition-colors border-b ${theme === 'light' ? 'border-gray-100' : 'border-gray-800/50'}`}
                            >
                                <div className="flex items-center gap-2">
                                    <motion.div
                                        animate={{ rotate: publishedOpen ? 90 : 0 }}
                                        transition={{ duration: 0.1 }}
                                    >
                                        <ChevronDown size={14} className={textMutedClass} style={{ transform: !publishedOpen ? 'rotate(-90deg)' : 'none' }} />
                                    </motion.div>
                                    <span className={`text-xs font-bold uppercase tracking-wider ${textMutedClass}`}>Đã đăng</span>
                                    <span className={`text-xs ${textMutedClass}`}>
                                        ({totalPublished})
                                    </span>
                                </div>
                            </button>

                            <AnimatePresence>
                                {publishedOpen && (
                                    <motion.div
                                        variants={contentVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit="exit"
                                        className=""
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
                                                    isOpen={isActOpen(`published-${actData.act._id}`)}
                                                    onToggle={toggleAct}
                                                    theme={theme}
                                                    selectedChapterId={selectedChapterId}
                                                    onSelectChapter={onSelectChapter}
                                                    onEditAct={handleEditAct}
                                                    onDeleteChapter={(item) => {
                                                        setDeletingChapter(item);
                                                        setIsDeletePopupOpen(true);
                                                    }}
                                                    onEditChapter={handleEditChapter}
                                                />
                                            );
                                        })}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="">
                            <button
                                onClick={() => setDraftsOpen(!draftsOpen)}
                                className={`w-full px-3 py-2 flex items-center justify-between ${hoverClass} transition-colors border-b ${theme === 'light' ? 'border-gray-100' : 'border-gray-800/50'}`}
                            >
                                <div className="flex items-center gap-2">
                                    <motion.div
                                        animate={{ rotate: draftsOpen ? 90 : 0 }}
                                        transition={{ duration: 0.1 }}
                                    >
                                        <ChevronDown size={14} className={textMutedClass} style={{ transform: !draftsOpen ? 'rotate(-90deg)' : 'none' }} />
                                    </motion.div>
                                    <span className={`text-xs font-bold uppercase tracking-wider ${textMutedClass}`}>Bản nháp</span>
                                    <span className={`text-xs ${textMutedClass}`}>
                                        ({totalDrafts})
                                    </span>
                                </div>
                            </button>

                            <AnimatePresence>
                                {draftsOpen && (
                                    <motion.div
                                        variants={contentVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit="exit"
                                        className=""
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
                                                    isOpen={isActOpen(`draft-${actData.act._id}`)}
                                                    onToggle={toggleAct}
                                                    theme={theme}
                                                    selectedChapterId={selectedChapterId}
                                                    onSelectChapter={onSelectChapter}
                                                    onEditAct={handleEditAct}
                                                    onDeleteChapter={(item) => {
                                                        setDeletingChapter(item);
                                                        setIsDeletePopupOpen(true);
                                                    }}
                                                    onEditChapter={handleEditChapter}
                                                />
                                            );
                                        })}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
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
