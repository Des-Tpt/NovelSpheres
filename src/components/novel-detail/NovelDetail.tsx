'use client';
import { getNovelById } from '@/action/novelActions';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import LoadingComponent from '../ui/Loading';
import React, { useEffect, useState } from 'react';
import getImage from '@/action/imageActions';
import Image from 'next/image';
import { Book, BookMarked, Heart, Share2, StepForward, Calendar, Eye, Clock, BookOpenIcon, Star, MessageCircle, Send, ChevronUp, ChevronDown, Plus, FileText, Newspaper, CirclePlus, Edit2, Trash2, Settings } from 'lucide-react';
import { createComment } from '@/action/commentActions';
import findParentComment from '@/utils/findParentComment';
import CommentItem from '../ui/CommentItem';
import handleToProfile from '@/utils/handleToProfile';
import { AnimatePresence, motion } from 'framer-motion';
import countTotalComments from '@/utils/countComment';
import { toast } from 'sonner';
import { getUserFromCookies } from '@/action/userAction';
import { notifyError, notifySuccess } from '@/utils/notify';
import CreateActPopup from './CreateAct';
import CreateChapterPopup from './CreateChapter';
import EditActPopup from './UpdateAct';
import EditChapterPopup from './UpdateChapter';
import DeleteActPopup from './DeteteAct';
import DeleteChapterPopup from './DeleteChapter';
import handleStatus from '@/utils/handleStatus';
import EditNovelPopup from './UpdateNovel';

const cloudname = process.env.NEXT_PUBLIC_CLOUDINARY_NAME! as string;
const defaultFallback = `https://res.cloudinary.com/${cloudname}/image/upload/LightNovel/BookCover/96776418_p0_qov0r8.png`;

const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.4 } }
};

interface Comment {
    _id: string;
    userId: { _id: string; username: string; role: string; profile?: { avatar?: { publicId: string; format: string } } };
    content: string;
    replyToUserId?: { username: string; _id: string };
    replies: Comment[];
    createdAt: string;
}

interface Genres {
    _id: string;
    name: string;
}

interface Novel {
    _id: string;
    title: string;
    authorId: { _id: string; username: string; profile?: { avatar?: { publicId: string; format: string } } };
    description: string;
    rating: number;
    likes: number;
    status: string;
    updatedAt: string;
    views: number;
    coverImage?: { publicId: string; format: string };
    genresId?: Genres[];
    authorNovelCount: number;
    chaptersCount?: number;
}

interface Chapter {
    _id: string;
    title: string;
    chapterNumber: number;
    wordCount: number;
    updatedAt: Date;
}

interface Act {
    _id: string;
    title: string;
    actType: string;
    actNumber: number;
    chapters: Chapter[];
    publicId?: string;
    format?: string;
}

interface CurrentUser {
    _id: string;
    username: string;
    email: string;
    publicId: string;
    format: string;
    role: string;
}

interface ActData {
    _id: string;
    userId: string,
    novelId: string,
    title: string;
    actType: string;
    actNumber: number;
    fileUrl?: string;
}

interface ChapterData {
    _id: string;
    actId: string;
    title: string;
    chapterNumber: number;
    wordCount: number;
}

interface NovelData {
    _id: string;
    title: string;
    description: string;
    status: string;
    genresId: Genres[];
    coverImage: {
        publicId: string;
        format: string;
    };
}


const NovelDetail = () => {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const novelId = params.id;

    const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
    const [showAllGenres, setShowAllGenres] = useState(false);
    const [authorImage, setAuthorImage] = useState<string>('');
    const [coverImage, setCoverImage] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'description' | 'chapters' | 'comments'>('description');
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [newCommentContent, setNewCommentContent] = useState('');
    const [replyToUser, setReplyToUser] = useState<{ id: string; username: string } | null>(null);
    const [showAllReplies, setShowAllReplies] = useState<Set<string>>(new Set());
    const [openActs, setOpenActs] = useState<Set<string>>(new Set());
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [isCreateActPopupOpen, setIsCreateActPopupOpen] = useState<boolean>(false);
    const [isCreateChapterPopupOpen, setIsCreateChapterPopupOpen] = useState<boolean>(false);
    const [selectedActId, setSelectedActId] = useState<string>('');
    const [isShowEditActPopup, setIsShowEditActPopup] = useState<boolean>(false);
    const [editActData, setEditActData] = useState<ActData | null>(null);
    const [editChapterData, setEditChapterData] = useState<ChapterData | null>(null);
    const [isShowEditChapterPopup, setIsShowEditChapterPopup] = useState(false);
    const [isShowDeleteActPopup, setIsShowDeleteActPopup] = useState(false);
    const [selectedAct, setSelectedAct] = useState<{ actId: string; actNumber: number, userId: string; novelId: string; } | null>(null);
    const [isShowDeleteChapter, setIsShowDeleteChapter] = useState(false);
    const [selectedChapter, setSelectedChapter] = useState<{ chapterId: string; chapterNumber: number, chapterTitle: string, actId: string; userId: string, novelId: string; } | null>(null);
    const [isShowEditNovelPopup, setIsShowEditNovelPopup] = useState<boolean>(false);
    const [selectedNovel, setSelectedNovel] = useState<NovelData | null>(null);


    const { data, isLoading, error } = useQuery<{ novel: Novel, comments: Comment[], acts: Act[] }>({
        queryKey: ['novelDetail', novelId],
        queryFn: () => getNovelById(novelId as string),
    });

    useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                const response = await getUserFromCookies();
                if (response?.user) setCurrentUser(response?.user);
            } catch (error) {
                setCurrentUser(null);
            }
        };
        fetchCurrentUser();
    }, []);

    const isAuthor = currentUser && data?.novel && currentUser?._id === data.novel.authorId?._id;

    const mutation = useMutation({
        mutationFn: createComment,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['novelDetail', novelId] });
            notifySuccess('Bình luận thành công!');
        },
        onError: () => notifyError('Bình luận thất bại!'),
    });

    const handleReply = (commentId: string, username: string, userId: string) => {
        setReplyingTo(commentId);
        setReplyToUser({ id: userId, username });
        setReplyContent('');
    };

    const handleCancelReply = () => {
        setReplyingTo(null);
        setReplyContent('');
        setReplyToUser(null);
    };

    const handleSubmitReply = async (parentCommentId: string) => {
        if (!replyContent.trim() || !replyToUser || !data?.comments) return;
        try {
            const parentId = findParentComment(parentCommentId, data.comments);
            await mutation.mutateAsync({
                sourceId: novelId as string,
                content: replyContent,
                sourceType: 'Novel',
                parentId: parentId,
                replyToUserId: replyToUser.id,
            });
            setReplyingTo(null);
            setReplyContent('');
            setReplyToUser(null);
        } catch (error) {
            console.error('Gặp lỗi bất thường khi bình luận!');
        }
    };

    const handleSubmitComment = async () => {
        if (!newCommentContent.trim()) return;
        try {
            await mutation.mutateAsync({
                sourceId: novelId as string,
                content: newCommentContent,
                sourceType: 'Novel',
                parentId: undefined,
                replyToUserId: undefined,
            });
            setNewCommentContent('');
        } catch (error) {
            toast.error('Gặp lỗi bất thường khi bình luận!');
        }
    };


    // interface NovelData {
    //     _id: string;
    //     title: string;
    //     description: string;
    //     status: string;
    //     genresId: string[];
    //     coverImage?: {
    //         publicId: string;
    //         format: string;
    //     };
    // }

    const handleEditNovel = (novelId: string, title: string, description: string, status: string, genreId: Genres[], publicId: string, format: string, e: React.MouseEvent) => {
        e.stopPropagation();

        const novelData: NovelData = {
            _id: novelId,
            title: title,
            description: description,
            status: status,
            genresId: genreId,
            coverImage: {
                publicId: publicId,
                format: format,
            }
        }

        setSelectedNovel(novelData);
        setIsShowEditNovelPopup(true);
    }

    const handleAddChapter = (actId: string) => {
        setSelectedActId(actId);
        setIsCreateChapterPopupOpen(true);
    };

    const handleAddAct = () => {
        setIsCreateActPopupOpen(true);
    };

    const handleEditAct = (act: Act, novelId: string, currentUserId: string, e: React.MouseEvent) => {
        e.stopPropagation();

        const actData: ActData = {
            _id: act._id,
            userId: currentUserId,
            novelId: novelId,
            title: act.title,
            actType: act.actType || '',
            actNumber: act.actNumber,
            fileUrl: act.publicId && imageUrls[act.publicId] ? imageUrls[act.publicId] : undefined
        };

        setEditActData(actData);
        setIsShowEditActPopup(true);
    };

    const handleDeleteAct = (actId: string, currentUserId: string, novelId: string, actNumber: number, e: React.MouseEvent) => {
        e.stopPropagation();

        setSelectedAct({
            actId: actId,
            userId: currentUserId,
            novelId: novelId,
            actNumber: actNumber,
        });
        setIsShowDeleteActPopup(true);
    };


    const handleEditChapter = (chapter: Chapter, actId: string, e: React.MouseEvent) => {
        e.stopPropagation();

        const chapterData: ChapterData = {
            _id: chapter._id,
            actId: actId,
            title: chapter.title,
            chapterNumber: chapter.chapterNumber,
            wordCount: chapter.wordCount,
        };

        setEditChapterData(chapterData);
        setIsShowEditChapterPopup(true);
    };

    const handleDeleteChapter = (chapterId: string, chapterTitle: string, chapterNumber: number, actId: string, userId: string, novelId: string, e: React.MouseEvent) => {
        e.stopPropagation();

        setSelectedChapter({
            chapterId: chapterId,
            chapterTitle: chapterTitle,
            chapterNumber: chapterNumber,
            actId: actId,
            userId: userId,
            novelId: novelId,
        });
        setIsShowDeleteActPopup(true);
    };

    useEffect(() => {
        if (!data?.comments || !Array.isArray(data.comments)) return;
        data.comments.forEach(async (comment) => {
            const publicId = comment.userId.profile?.avatar?.publicId;
            const format = comment.userId.profile?.avatar?.format;
            if (publicId && format) {
                try {
                    const res = await getImage(publicId, format);
                    if (res) setImageUrls((prev) => ({ ...prev, [publicId]: res }));
                } catch (error) {
                    console.error('Lỗi khi load avatar comment:', error);
                }
            }
            if (comment.replies && Array.isArray(comment.replies)) {
                comment.replies.forEach(async (reply) => {
                    const replyPublicId = reply.userId.profile?.avatar?.publicId;
                    const replyFormat = reply.userId.profile?.avatar?.format;
                    if (replyPublicId && replyFormat) {
                        try {
                            const res = await getImage(replyPublicId, replyFormat);
                            if (res) setImageUrls((prev) => ({ ...prev, [replyPublicId]: res }));
                        } catch (error) {
                            console.error('Lỗi khi load avatar reply:', error);
                        }
                    }
                });
            }
        });
    }, [data?.comments]);

    useEffect(() => {
        const authorAvatar = data?.novel?.authorId?.profile?.avatar;
        if (authorAvatar?.publicId && authorAvatar?.format) {
            getImage(authorAvatar.publicId, authorAvatar.format)
                .then((res) => setAuthorImage(res || defaultFallback))
                .catch(() => setAuthorImage(defaultFallback));
        } else {
            setAuthorImage(defaultFallback);
        }
    }, [data?.novel?.authorId?.profile?.avatar]);

    useEffect(() => {
        const novelCover = data?.novel?.coverImage;
        if (novelCover?.publicId && novelCover?.format) {
            getImage(novelCover.publicId, novelCover.format)
                .then((res) => setCoverImage(res || defaultFallback))
                .catch(() => setCoverImage(defaultFallback));
        } else {
            setCoverImage(defaultFallback);
        }
    }, [data?.novel?.coverImage]);

    useEffect(() => {
        if (!data) return;
        const fetchImages = async () => {
            for (const act of data?.acts) {
                const publicId = act.publicId;
                const format = act.format ?? 'jpg';
                if (publicId && !imageUrls[publicId]) {
                    const res = await getImage(publicId, format);
                    if (res) setImageUrls((prev) => ({ ...prev, [publicId]: res }));
                }
            }
        };
        fetchImages();
    }, [data, imageUrls]);

    const formatComment = (comments: Comment[]) => {
        if (!comments || comments.length === 0) return [];
        return comments.map(comment => ({
            parent: comment,
            replies: (comment.replies || []).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
        }));
    };

    const toggleShowAllReplies = (commentId: string) => {
        const newShowAll = new Set(showAllReplies);
        if (newShowAll.has(commentId)) {
            newShowAll.delete(commentId);
        } else {
            newShowAll.add(commentId);
        }
        setShowAllReplies(newShowAll);
    };

    const renderComment = (comment: Comment, isReply: boolean = false) => {
        return (
            <CommentItem
                key={comment._id}
                comment={comment}
                isReply={isReply}
                imageUrls={imageUrls}
                cloudname={cloudname}
                replyingTo={replyingTo}
                replyContent={replyContent}
                replyToUser={replyToUser}
                isSubmitting={mutation.isPending}
                onReply={handleReply}
                onReplyContentChange={setReplyContent}
                onSubmitReply={handleSubmitReply}
                onCancelReply={handleCancelReply}
                onProfileClick={handleToProfile}
            />
        );
    };

    const toggleShowChapter = (actId: string) => {
        const newOpenActs = new Set(openActs);
        if (newOpenActs.has(actId)) {
            newOpenActs.delete(actId);
        } else {
            newOpenActs.add(actId);
        }
        setOpenActs(newOpenActs);
    };

    const formatNumberVN = (num: number) => num.toLocaleString("vi-VN");
    const formatDateVN = (dateInput: string | Date) => {
        const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
        return date.toLocaleDateString("vi-VN");
    };

    const organizedComments = data?.comments ? formatComment(data.comments) : [];

    if (isLoading) return <LoadingComponent />;
    if (error) {
        if (error instanceof Error) {
            return <div className="text-red-500 p-4">{error.message}</div>;
        }
        return <div className="text-red-500 p-4">Đã xảy ra lỗi không xác định.</div>;
    }
    if (!data) return <div className="text-white p-4">Không có dữ liệu</div>;

    return (
        <div className='container px-4 py-4 sm:px-5 sm:py-5'>
            <title>{data.novel.title}</title>
            <motion.div
                className='flex flex-col lg:flex-row gap-6 lg:gap-8'
                initial="hidden"
                animate="visible"
                variants={itemVariants}
            >
                {/* Cover Image và Actions */}
                <motion.div
                    className='flex flex-col w-full lg:w-auto'
                    variants={itemVariants}
                >
                    <div className='flex flex-col p-4 sm:p-5 justify-center items-center md:items-stretch rounded-lg bg-gray-950 border border-gray-500'>
                        <Image
                            src={coverImage || defaultFallback}
                            width={350} // Giảm kích thước ảnh trên mobile
                            height={350}
                            alt={data?.novel?.title || 'Novel Cover'}
                            className="rounded-lg object-cover object-top shadow-md w-full sm:w-[350px] sm:h-[450px]"
                        />
                        <button
                            className='mt-3 sm:mt-4 px-3 sm:px-4 py-2 text-base sm:text-lg pl-1 cursor-pointer bg-blue-500 font-bold text-white rounded-lg hover:bg-blue-600 transition-colors inline-flex items-center justify-center gap-2'
                            onClick={() => router.push(`/chapters/${data?.acts?.[0]?.chapters?.[0]?._id}`)}
                        >
                            <StepForward className='w-4 sm:w-4.5 h-4 sm:h-4.5 align-middle' />
                            Bắt đầu đọc
                        </button>
                        {isAuthor && (
                            <button
                                className='mt-2 sm:mt-3 px-3 sm:px-4 py-2 text-base sm:text-lg pl-1 cursor-pointer bg-red-600 font-bold text-white rounded-lg hover:bg-blue-600 transition-colors inline-flex items-center justify-center gap-2'
                                onClick={(e) => handleEditNovel(data.novel._id, data.novel.title, data.novel.description, data.novel.status, data.novel.genresId!, data?.novel.coverImage?.publicId ?? '', data?.novel.coverImage?.format ?? '', e)}
                            >
                                <Settings className='w-4 sm:w-4.5 h-4 sm:h-4.5 align-middle' />
                                Chỉnh sửa
                            </button>
                        )}
                        <div className='flex justify-between gap-2 sm:gap-3 md:gap-1 md:w-full mt-2 sm:mt-3'>
                            <button><div className='cursor-pointer flex px-5 sm:px-6.5 py-2 sm:py-3 border items-center flex-col gap-1 sm:gap-2 rounded-lg bg-gray-950 group hover:bg-gray-500 hover:transition-colors'>
                                <Heart className='w-4 sm:w-5 h-4 sm:h-5 text-red-500 group-hover:text-yellow-700 transition-colors duration-75' />
                                <span className='text-xs sm:text-sm'>Yêu thích</span>
                            </div></button>
                            <button><div className='flex cursor-pointer px-6.5 sm:px-7.5 py-2 sm:py-3 border items-center flex-col gap-1 sm:gap-2 rounded-lg bg-gray-950 group hover:bg-gray-500 hover:transition-colors'>
                                <BookMarked className='w-4 sm:w-5 h-4 sm:h-5 text-blue-500 group-hover:text-yellow-700 transition-colors duration-75' />
                                <span className='text-xs sm:text-sm'>Đánh dấu</span>
                            </div></button>
                            <button><div className='flex cursor-pointer px-7 sm:px-8.5 py-2 sm:py-3 border items-center flex-col gap-1 sm:gap-2 rounded-lg bg-gray-950 group hover:bg-gray-500 hover:transition-colors'>
                                <Share2 className='w-4 sm:w-5 h-4 sm:h-5 text-blue-500 group-hover:text-yellow-700 transition-colors duration-75' />
                                <span className='text-xs sm:text-sm'>Chia sẻ</span>
                            </div></button>
                        </div>
                    </div>
                </motion.div>

                {/* Thông tin chính */}
                <motion.div
                    className='flex-1'
                    variants={itemVariants}
                >
                    {/* Header thông tin */}
                    <motion.div
                        className='mb-4 sm:mb-6 bg-gray-950 p-4 sm:p-5 border border-gray-500 rounded-lg'
                        variants={itemVariants}
                    >
                        <div className='flex gap-2 items-center flex-wrap mb-3 sm:mb-4'>
                            <span className='bg-gray-950 border-amber-600 border px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm'>
                                {handleStatus(data.novel.status)}
                            </span>                            {data?.novel.genresId && !showAllGenres && data.novel.genresId.length > 3 ? (
                                data.novel.genresId.slice(0, 3).map((genre) =>
                                    <span key={genre._id} className='bg-gray-800 text-blue-300 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm'>
                                        {genre.name}
                                    </span>
                                )
                            ) : (
                                data?.novel?.genresId?.map((genre) => (
                                    <span key={genre._id} className='bg-gray-800 text-blue-300 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm'>
                                        {genre.name}
                                    </span>
                                ))
                            )}
                            {!showAllGenres && data?.novel?.genresId && data.novel.genresId.length > 3 &&
                                <span className='bg-gray-800 text-blue-400 px-2 sm:px-3 py-1 hover:bg-gray-600 cursor-pointer transition-colors duration-75 rounded-full text-xs sm:text-sm'
                                    onClick={() => setShowAllGenres(true)}>
                                    ...
                                </span>
                            }
                        </div>

                        <div className='flex justify-between items-center mb-3 sm:mb-4'>
                            <h1 className='text-2xl sm:text-3xl font-bold text-white'>{data?.novel?.title}</h1>
                        </div>

                        <div className='flex items-center border border-gray-400 p-4 rounded-lg gap-2 sm:gap-3'>
                            {authorImage && (
                                <Image
                                    src={authorImage}
                                    width={80}
                                    height={80}
                                    alt={data?.novel?.authorId?.username || 'Avatar tác giả'}
                                    className="rounded-full w-10 sm:w-13 h-10 sm:h-13 object-cover"
                                />
                            )}
                            <div className='text-gray-300 flex flex-col'>
                                <span className='text-blue-400 font-bold text-base sm:text-lg'>
                                    {data?.novel?.authorId?.username ?? 'Vô danh'}
                                </span>
                                <span className='text-[0.65rem] sm:text-[0.75rem] flex items-center gap-2 sm:gap-3'>
                                    <span className='inline text-[0.9rem] sm:text-[1rem]'>15k người theo dõi</span>●
                                    <span className='text-[0.9rem] sm:text-[1rem]'>{data?.novel?.authorNovelCount || 0} tác phẩm</span>
                                </span>
                            </div>
                            {isAuthor && (
                                <div className='flex items-center ml-auto gap-2 bg-gradient-to-r from-yellow-600 to-orange-600 px-2 sm:px-3 py-1 rounded-full'>
                                    <Star className='w-3 sm:w-4 h-3 sm:h-4 text-white' />
                                    <span className='text-white text-xs sm:text-sm font-medium'>Tác giả</span>
                                </div>
                            )}
                        </div>
                        <div className='my-4 sm:my-6 border-b-[1px] border-gray-400'></div>

                        <div className='block sm:hidden overflow-x-auto pb-2'>
                            <div className='flex gap-4 px-4 min-w-max'>
                                <div className='flex flex-col justify-center items-center bg-gray-900/40 border border-gray-200 rounded-lg p-4 min-w-[80px]'>
                                    <BookOpenIcon className='w-5 h-5 mb-2 text-blue-400' />
                                    <span className='text-lg font-bold'>{data?.novel.chaptersCount}</span>
                                    <span className='text-xs text-gray-400 text-center'>Số chương</span>
                                </div>
                                <div className='flex flex-col justify-center items-center bg-gray-900/40 border border-gray-200 rounded-lg p-4 min-w-[80px]'>
                                    <Heart className='w-5 h-5 mb-2 text-red-400' />
                                    <span className='text-lg font-bold'>{data?.novel.likes && data.novel.likes > 100 ? data.novel.likes : '9.6K'}</span>
                                    <span className='text-xs text-gray-400 text-center'>Theo dõi</span>
                                </div>
                                <div className='flex flex-col justify-center items-center bg-gray-900/40 border border-gray-200 rounded-lg p-4 min-w-[80px]'>
                                    <Star className='w-5 h-5 mb-2 text-yellow-500' />
                                    <span className='text-lg font-bold'>4.6</span>
                                    <span className='text-xs text-gray-400 text-center'>Đánh giá</span>
                                </div>
                                <div className='flex flex-col justify-center items-center bg-gray-900/40 border border-gray-200 rounded-lg p-4 min-w-[80px]'>
                                    <Eye className='w-5 h-5 mb-2 text-green-400' />
                                    <span className='text-lg font-bold'>{data?.novel.views && data.novel.views > 1 ? data?.novel.views : '1.7M'}</span>
                                    <span className='text-xs text-gray-400 text-center'>Lượt xem</span>
                                </div>
                                <div className='flex flex-col justify-center items-center bg-gray-900/40 border border-gray-200 rounded-lg p-4 min-w-[100px]'>
                                    <Clock className='w-5 h-5 mb-2 text-yellow-400' />
                                    <span className='text-lg font-bold'>{data?.novel.updatedAt ? formatDateVN(data.novel.updatedAt) : 'N/A'}</span>
                                    <span className='text-xs text-gray-400 text-center'>Cập nhật</span>
                                </div>
                            </div>
                        </div>
                        {/* Desktop version */}
                        <div className='hidden sm:flex flex-wrap gap-6 px-10 justify-between'>
                            <div className='flex flex-col justify-center items-center'>
                                <BookOpenIcon className='w-5 h-5 mb-1 text-blue-400' />
                                <span className='text-lg font-bold'>{data?.novel.chaptersCount}</span>
                                <span className='text-[1rem]'>Số chương</span>
                            </div>
                            <div className='flex flex-col justify-center items-center'>
                                <Heart className='w-5 h-5 mb-1 text-red-400' />
                                <span className='text-lg font-bold'>{data?.novel.likes && data.novel.likes > 100 ? data.novel.likes : '9.6K'}</span>
                                <span className='text-[1rem]'>Lượt theo dõi</span>
                            </div>
                            <div className='flex flex-col justify-center items-center'>
                                <Star className='w-5 h-5 mb-1 text-yellow-500' />
                                <span className='text-lg font-bold'>4.6</span>
                                <span className='text-[1rem]'>Đánh giá</span>
                            </div>
                            <div className='flex flex-col justify-center items-center'>
                                <Eye className='w-5 h-5 mb-1 text-green-400' />
                                <span className='text-lg font-bold'>{data?.novel.views && data.novel.views > 1 ? data?.novel.views : '1.7M'}</span>
                                <span className='text-[1rem]'>Lượt xem</span>
                            </div>
                            <div className='flex flex-col justify-center items-center'>
                                <Clock className='w-5 h-5 mb-1 text-yellow-400' />
                                <span className='text-lg font-bold'>{data?.novel.updatedAt ? formatDateVN(data.novel.updatedAt) : 'N/A'}</span>
                                <span className='text-[1rem]'>Cập nhật</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Tab Navigation */}
                    <motion.div
                        className='flex w-full mb-4 sm:mb-6'
                        variants={itemVariants}
                    >
                        <nav className='flex w-full border border-gray-400 text-base sm:text-lg rounded-lg'>
                            <button
                                onClick={() => setActiveTab('description')}
                                className={`flex-1 cursor-pointer py-2 sm:py-3 px-3 sm:px-4 font-medium transition-all duration-200 rounded-l-lg ${activeTab === 'description'
                                    ? 'bg-gray-900 text-white'
                                    : 'bg-gray-950 text-gray-300 hover:bg-gray-700'
                                    }`}
                            >
                                Mô tả
                            </button>
                            <button
                                onClick={() => setActiveTab('chapters')}
                                className={`flex-1 cursor-pointer py-2 sm:py-3 px-3 sm:px-4 font-medium transition-all duration-200 border-l border-r border-gray-600 ${activeTab === 'chapters'
                                    ? 'bg-gray-900 text-white'
                                    : 'bg-gray-950 text-gray-300 hover:bg-gray-700'
                                    }`}
                            >
                                Chương
                            </button>
                            <button
                                onClick={() => setActiveTab('comments')}
                                className={`flex-1 cursor-pointer py-2 sm:py-3 px-3 sm:px-4 font-medium transition-all duration-200 rounded-r-lg ${activeTab === 'comments'
                                    ? 'bg-gray-900 text-white'
                                    : 'bg-gray-950 text-gray-300 hover:bg-gray-700'
                                    }`}
                            >
                                Bình luận
                            </button>
                        </nav>
                    </motion.div>

                    {/* Tab Content */}
                    <motion.div
                        className='min-h-[300px] sm:min-h-[400px]'
                        variants={itemVariants}
                    >
                        {activeTab === 'description' && (
                            <div className='prose prose-invert max-w-none'>
                                <div className='bg-gray-950 border border-gray-400 rounded-lg p-4 sm:p-6'>
                                    <h3 className='text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-white'>Cốt truyện tổng quan</h3>
                                    <div className='text-gray-300 text-sm sm:text-[1.2rem] whitespace-pre-wrap'>
                                        {data.novel.description ? (
                                            <div dangerouslySetInnerHTML={{ __html: data.novel.description }}></div>
                                        ) : (
                                            'Chưa có mô tả cho truyện này.'
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'chapters' && (
                            <div className='space-y-2 bg-gray-950 border border-gray-400 rounded-lg overflow-hidden'>
                                {isAuthor && (
                                    <div className='py-3 sm:py-4 px-4 sm:px-6 flex bg-gray-950 border-b justify-between items-center border-gray-600 rounded-t-lg'>
                                        <h3 className='text-base sm:text-lg font-semibold text-white flex items-center gap-2'>
                                            <Star className='w-4 sm:w-5 h-4 sm:h-5 text-yellow-500' />
                                            Quản lý tác phẩm
                                        </h3>
                                        <button
                                            onClick={handleAddAct}
                                            className='flex items-center cursor-pointer gap-2 px-3 sm:px-4 py-1 sm:py-2 bg-gray-950 border border-gray-400 hover:bg-gray-800 text-white rounded-lg font-medium text-sm sm:text-base transition-colors'
                                        >
                                            <FileText className='w-3 sm:w-4 h-3 sm:h-4' />
                                            Thêm phần
                                        </button>
                                    </div>
                                )}

                                {data?.acts && data.acts.length > 0 ? (
                                    data.acts.map((act) => (
                                        <div key={act._id} className='overflow-hidden border-b border-gray-600 last:border-b-0 bg-gray-950'>
                                            <div
                                                onClick={() => toggleShowChapter(act._id)}
                                                className='p-4 sm:p-6 cursor-pointer hover:bg-gray-750 transition-all duration-200 group'
                                            >
                                                <h3 className='text-lg sm:text-xl font-semibold text-white flex items-center justify-between'>
                                                    <div className='flex items-center gap-3'>
                                                        <Book className='w-5 sm:w-6 h-5 sm:h-6 text-gray-400' />
                                                        <span className='mb-1'>{act.actType ? act.actType : 'Act'} {act.actNumber} - {act.title}</span>
                                                    </div>
                                                    <div className='flex items-center gap-2'>
                                                        {isAuthor && (
                                                            <div className='flex gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200'>
                                                                <button
                                                                    onClick={(e) => handleEditAct(act, data.novel._id, currentUser._id, e)}
                                                                    className='p-2 cursor-pointer rounded-lg hover:bg-gray-600 text-gray-400 hover:text-blue-400 transition-colors'
                                                                    title='Sửa phần'
                                                                >
                                                                    <Edit2 className='w-4 h-4' />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => handleDeleteAct(act._id, currentUser._id, data.novel._id, act.actNumber, e)}
                                                                    className='p-2 cursor-pointer rounded-lg hover:bg-gray-600 text-gray-400 hover:text-red-400 transition-colors'
                                                                    title='Xóa phần'
                                                                >
                                                                    <Trash2 className='w-4 h-4' />
                                                                </button>
                                                            </div>
                                                        )}
                                                        <div className={`transform transition-transform duration-300 ${openActs.has(act._id) ? 'rotate-180' : 'rotate-0'}`}>
                                                            <ChevronDown className='w-5 sm:w-6 h-5 sm:h-6 text-gray-400 group-hover:text-gray-400' />
                                                        </div>
                                                    </div>
                                                </h3>
                                            </div>

                                            <AnimatePresence>
                                                {openActs.has(act._id) && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                                                        className='overflow-hidden'
                                                    >
                                                        <div className='border-t border-gray-700 bg-gray-950'>
                                                            <div className="flex flex-col lg:flex-row gap-6 p-6">
                                                                {/* Act Cover Section */}
                                                                <div className="w-full flex flex-col items-center lg:block lg:w-48">
                                                                    <div className="relative group w-48"> {/* cố định width để ảnh & box bằng nhau */}
                                                                        <Image
                                                                            src={act.publicId && imageUrls[act.publicId] ? imageUrls[act.publicId] : defaultFallback}
                                                                            width={400}
                                                                            height={400}
                                                                            alt={`Act ${act.actNumber} Cover`}
                                                                            className="rounded-lg shadow-xl w-full object-cover border border-gray-600 aspect-[3/4] group-hover:scale-105 transition-transform duration-200"
                                                                        />
                                                                        <div className="absolute inset-0 bg-black/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                                                                    </div>
                                                                    <div className="mt-3 text-center bg-gray-700 rounded-lg py-2 w-48">
                                                                        <p className="text-sm font-semibold text-gray-300">
                                                                            {act.chapters.length} chương
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                {/* Chapters Section */}
                                                                <div className='flex-1 min-w-0'>
                                                                    <div className='mb-4'>
                                                                        <h4 className='text-lg font-semibold text-white mb-3 flex items-center gap-2'>
                                                                            <BookOpenIcon className='w-5 h-5 text-white' />
                                                                            Danh sách chương
                                                                        </h4>
                                                                    </div>

                                                                    <div className={`space-y-3 ${act.chapters.length > 5 ? 'max-h-96 overflow-y-auto pr-2' : ''}`}>
                                                                        {act.chapters.map((chapter, index) => (
                                                                            <motion.div
                                                                                key={chapter._id}
                                                                                initial={{ opacity: 0, x: -20 }}
                                                                                animate={{ opacity: 1, x: 0 }}
                                                                                transition={{ duration: 0.2, delay: index * 0.05 }}
                                                                                onClick={() => router.push(`/chapter/${chapter._id}`)}
                                                                                className='bg-gray-950 hover:bg-gray-650 cursor-pointer transition-all duration-200 group rounded-lg border border-gray-600 hover:border-white p-4'
                                                                            >
                                                                                <div className='flex items-center justify-between'>
                                                                                    <div className='flex-1 min-w-0 mr-4'>
                                                                                        <h5 className='text-gray-200 font-semibold text-base group-hover:text-blue-500 transition-colors mb-2 truncate'>
                                                                                            Chương {chapter.chapterNumber}: {chapter.title}
                                                                                        </h5>
                                                                                        <div className='flex flex-wrap gap-4 text-xs text-gray-400'>
                                                                                            <span className='flex items-center gap-1'>
                                                                                                <BookOpenIcon className='w-3 h-3' />
                                                                                                {formatNumberVN(chapter.wordCount)} từ
                                                                                            </span>
                                                                                            <span className='flex items-center gap-1'>
                                                                                                <Calendar className='w-3 h-3' />
                                                                                                {formatDateVN(chapter.updatedAt)}
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>
                                                                                    {isAuthor && (
                                                                                        <div className='flex mr-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200'>
                                                                                            <button
                                                                                                onClick={(e) => handleEditChapter(chapter, act._id, e)}
                                                                                                className='p-2 cursor-pointer rounded-lg hover:bg-gray-600 text-gray-400 hover:text-blue-400 transition-colors'
                                                                                                title='Sửa chapter'
                                                                                            >
                                                                                                <Edit2 className='w-4 h-4' />
                                                                                            </button>
                                                                                            <button
                                                                                                onClick={(e) => handleDeleteChapter(chapter._id, chapter.title, chapter.chapterNumber, act._id, currentUser._id, data.novel._id, e)}
                                                                                                className='p-2 cursor-pointer rounded-lg hover:bg-gray-600 text-gray-400 hover:text-red-400 transition-colors'
                                                                                                title='Xóa chapter'
                                                                                            >
                                                                                                <Trash2 className='w-4 h-4' />
                                                                                            </button>
                                                                                        </div>
                                                                                    )}
                                                                                    <StepForward className='w-6 h-6 text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0' />
                                                                                </div>
                                                                            </motion.div>
                                                                        ))}

                                                                        {/* Add Chapter Button */}
                                                                        {isAuthor && (
                                                                            <motion.div
                                                                                initial={{ opacity: 0, y: 20 }}
                                                                                animate={{ opacity: 1, y: 0 }}
                                                                                transition={{ duration: 0.3 }}
                                                                                className='bg-gray-950 hover:bg-gray-600 cursor-pointer transition-all duration-200 group rounded-lg border-2 border-dashed border-gray-600 hover:border-white p-4'
                                                                                onClick={() => handleAddChapter(act._id)}
                                                                            >
                                                                                <div className='flex items-center justify-center gap-3 text-gray-400 group-hover:text-white'>
                                                                                    <CirclePlus className='w-5 h-5' />
                                                                                    <span className='font-medium'>Thêm chương mới</span>
                                                                                </div>
                                                                            </motion.div>
                                                                        )}
                                                                    </div>

                                                                    {act.chapters.length > 5 && (
                                                                        <div className='mt-3 text-center'>
                                                                            <p className='text-xs text-gray-500 italic'>
                                                                                Scroll để xem thêm chương
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    ))
                                ) : (
                                    <div className='bg-gray-800 rounded-xl border border-gray-600 p-8 text-center'>
                                        <div className='max-w-md mx-auto'>
                                            <div className='bg-gray-700 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4'>
                                                <Book className='w-10 h-10 text-white' />
                                            </div>
                                            <h3 className='text-xl font-semibold text-white mb-2'>Chưa có nội dung</h3>
                                            <p className='text-gray-400 text-base mb-6'>
                                                Truyện này chưa có chương nào được đăng tải. {isAuthor ? 'Hãy tạo Act đầu tiên để bắt đầu!' : 'Hãy quay lại sau nhé!'}
                                            </p>
                                            {isAuthor && (
                                                <button
                                                    onClick={handleAddAct}
                                                    className='inline-flex items-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors shadow-lg hover:shadow-xl'
                                                >
                                                    <FileText className='w-4 h-4' />
                                                    Tạo Act đầu tiên
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'comments' && (
                            <div className='rounded-lg bg-gray-950 border border-gray-600'>
                                <motion.div
                                    className="px-4 sm:px-5 py-3 sm:py-4 rounded-[0.8rem]"
                                    variants={itemVariants}
                                >
                                    <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6 flex items-center gap-2">
                                        <MessageCircle className="w-4 sm:w-5 h-4 sm:h-5" />
                                        Bình luận ({data?.comments ? countTotalComments(data.comments) : 0})
                                    </h2>

                                    <motion.div
                                        className="rounded-lg"
                                        variants={itemVariants}
                                    >
                                        <textarea
                                            value={newCommentContent}
                                            onChange={(e) => setNewCommentContent(e.target.value)}
                                            placeholder="Viết bình luận của bạn..."
                                            className="w-full p-3 bg-gray-900 border border-gray-600 rounded-md text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                                            rows={3}
                                            disabled={mutation.isPending}
                                        />
                                        <div className="flex justify-end mt-2 sm:mt-3">
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={handleSubmitComment}
                                                className="flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm sm:text-base"
                                                disabled={mutation.isPending || !newCommentContent.trim()}
                                            >
                                                {mutation.isPending ? (
                                                    <>
                                                        <div className="w-3 sm:w-4 h-3 sm:h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                                        Đang đăng...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Send className="w-3 sm:w-4 h-3 sm:h-4" />
                                                        Đăng
                                                    </>
                                                )}
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                </motion.div>
                                <div className='border-t-[1px] border-white mx-4 sm:mx-5.5 pb-4 sm:pb-5'></div>
                                <div className="space-y-3 sm:space-y-4 mx-4 sm:mx-5 pb-4 sm:pb-5">
                                    {(!data?.comments || data.comments.length === 0) ? (
                                        <motion.div
                                            className="text-center py-6 sm:py-8 text-gray-400"
                                            variants={itemVariants}
                                        >
                                            <MessageCircle className="w-10 sm:w-12 h-10 sm:h-12 mx-auto mb-2 opacity-50" />
                                            <p className='text-sm sm:text-base'>Chưa có bình luận nào. Hãy là người đầu tiên bình luận!</p>
                                        </motion.div>
                                    ) : (
                                        <AnimatePresence>
                                            {organizedComments.map(({ parent, replies }) => (
                                                <motion.div
                                                    key={parent._id}
                                                    variants={itemVariants}
                                                >
                                                    {renderComment(parent, false)}
                                                    {replies.length > 0 && (
                                                        <div className="space-y-0">
                                                            {(showAllReplies.has(parent._id) ? replies : replies.slice(0, 2)).map((reply) =>
                                                                renderComment(reply, true)
                                                            )}
                                                            {replies.length > 2 && (
                                                                <motion.div
                                                                    className="ml-8 sm:ml-12 mt-2"
                                                                    initial={{ opacity: 0 }}
                                                                    animate={{ opacity: 1 }}
                                                                    transition={{ duration: 0.3 }}
                                                                >
                                                                    <motion.button
                                                                        whileHover={{ scale: 1.02 }}
                                                                        whileTap={{ scale: 0.98 }}
                                                                        onClick={() => toggleShowAllReplies(parent._id)}
                                                                        className="flex cursor-pointer items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-blue-400 hover:text-blue-300 transition-colors rounded-md hover:bg-gray-800/50"
                                                                    >
                                                                        {showAllReplies.has(parent._id) ? (
                                                                            <>
                                                                                <ChevronUp className="w-3 sm:w-4 h-3 sm:h-4" />
                                                                                Ẩn bớt phản hồi
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <ChevronDown className="w-3 sm:w-4 h-3 sm:h-4" />
                                                                                Hiển thị {replies.length - 2} phản hồi
                                                                            </>
                                                                        )}
                                                                    </motion.button>
                                                                </motion.div>
                                                            )}
                                                        </div>
                                                    )}
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    )}
                                </div>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            </motion.div>
            <AnimatePresence>
                {isCreateActPopupOpen && currentUser && (
                    <CreateActPopup
                        isOpen={isCreateActPopupOpen}
                        onClose={() => setIsCreateActPopupOpen(false)}
                        userId={currentUser?._id}
                        novelId={data.novel._id}
                    />
                )}
                {isCreateChapterPopupOpen && currentUser && (
                    <CreateChapterPopup
                        isOpen={isCreateChapterPopupOpen}
                        onClose={() => setIsCreateChapterPopupOpen(false)}
                        userId={currentUser._id}
                        novelId={data.novel._id}
                        actId={selectedActId}
                    />
                )}

                {isShowEditActPopup && currentUser && (
                    <EditActPopup
                        isOpen={isShowEditActPopup}
                        onClose={() => {
                            setIsShowEditActPopup(false);
                            setEditActData(null);
                        }}
                        userId={currentUser._id}
                        novelId={data.novel._id}
                        actData={editActData}
                    />
                )}

                {isShowEditChapterPopup && currentUser && (
                    <EditChapterPopup
                        isOpen={isShowEditChapterPopup}
                        onClose={() => {
                            setIsShowEditChapterPopup(false)
                            setEditChapterData(null)
                        }}
                        userId={currentUser._id}
                        novelId={data.novel._id}
                        chapter={editChapterData}
                    />
                )}

                {isShowDeleteActPopup && selectedAct && currentUser && (
                    <DeleteActPopup
                        isOpen={isShowDeleteActPopup}
                        onClose={() => {
                            setIsShowDeleteActPopup(false);
                            setSelectedAct(null);
                        }}
                        actData={selectedAct}
                    />
                )}

                {isShowDeleteChapter && selectedChapter && currentUser && (
                    <DeleteChapterPopup
                        isOpen={isShowDeleteChapter}
                        onClose={() => {
                            setIsShowDeleteChapter(false);
                            setSelectedChapter(null);
                        }}
                        chapterData={selectedChapter}
                    />
                )}
                {isShowEditNovelPopup && currentUser && (
                    <EditNovelPopup
                        isOpen={isShowEditNovelPopup}
                        onClose={() => {
                            setIsShowEditNovelPopup(false);
                            setSelectedNovel(null);
                        }}
                        novelData={selectedNovel}
                        userId={currentUser._id}
                    />
                )}
            </AnimatePresence>
        </div >
    );
};

export default NovelDetail;