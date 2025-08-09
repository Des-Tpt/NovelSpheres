'use client'
import { getNovelById } from '@/action/novelActions';
import { useQuery, useMutation, useQueryClient, QueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import LoadingComponent from '../ui/Loading';
import React, { useEffect, useState } from 'react';
import getImage from '@/action/imageActions';
import Image from 'next/image';
import { Book, BookMarked, Heart, Share2, StepForward, Calendar, Eye, Clock, BookOpenIcon, Star, MessageCircle, Send, ChevronUp, ChevronDown, Plus, FileText, Newspaper, CirclePlus } from 'lucide-react';
import { createComment } from '@/action/commentActions';
import findParentComment from '@/utils/findParentComment';
import CommentItem from '../ui/CommentItem';
import handleToProfile from '@/utils/handleToProfile';
import { AnimatePresence } from 'framer-motion';
import { motion } from 'framer-motion';
import countTotalComments from '@/utils/countComment';
import { toast } from 'sonner';
import { getUserFromCookies } from '@/action/userAction';
import { notifyError, notifySuccess } from '@/utils/notify';
import CreateActPopup from './CreateAct';
import CreateChapterPopup from './CreateChapter';

const cloudname = process.env.NEXT_PUBLIC_CLOUDINARY_NAME! as string;
const defaultFallback = `https://res.cloudinary.com/${cloudname}/image/upload/LightNovel/BookCover/96776418_p0_qov0r8.png`;

const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.4 }
    }
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
    authorId: {
        _id: string;
        username: string;
        profile?:
        {
            avatar?:
            {
                publicId: string;
                format: string
            }
        }
    };
    description: string;
    rating: number;
    likes: number;
    status: string;
    updatedAt: string;
    views: number;
    coverImage?: {
        publicId: string;
        format: string
    };
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
    actNumber: string;
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
                console.error('Lỗi khi lấy thông tin người dùng:', error);
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
            notifySuccess('Bình luận thành công!')
        },
        onError: (error: Error) => {
            notifyError('Bình luận thất bại!');
        }
    })

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
                replyToUserId: replyToUser.id
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
            })

            setNewCommentContent('');
        } catch (error) {
            toast.error('Gặp lỗi bất thường khi bình luận!')
        }
    }

    const handleAddChapter = (actId: string) => {
        setSelectedActId(actId);
        setIsCreateChapterPopupOpen(true);
    };

    const handleAddAct = () => {
        setIsCreateActPopupOpen(true);
    };

    useEffect(() => {
        if (!data?.comments || !Array.isArray(data.comments)) return;

        data.comments.forEach(async (comment) => {
            const publicId = comment.userId.profile?.avatar?.publicId;
            const format = comment.userId.profile?.avatar?.format;

            if (publicId && format) {
                try {
                    const res = await getImage(publicId, format);
                    if (res) {
                        setImageUrls((prev) => ({ ...prev, [publicId]: res }));
                    }
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
                            if (res) {
                                setImageUrls((prev) => ({ ...prev, [replyPublicId]: res }));
                            }
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
                .then((res) => {
                    setAuthorImage(res || defaultFallback);
                })
                .catch((error) => {
                    console.error('Lỗi khi load avatar tác giả:', error);
                    setAuthorImage(defaultFallback);
                });
        } else {
            setAuthorImage(defaultFallback);
        }
    }, [data?.novel?.authorId?.profile?.avatar]);

    useEffect(() => {
        const novelCover = data?.novel?.coverImage;
        if (novelCover?.publicId && novelCover?.format) {
            getImage(novelCover.publicId, novelCover.format)
                .then((res) => {
                    setCoverImage(res || defaultFallback);
                })
                .catch((error) => {
                    console.error('Lỗi khi load coverImage:', error);
                    setCoverImage(defaultFallback);
                });
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
                    if (res) {
                        setImageUrls((prev) => ({ ...prev, [publicId]: res }));
                    }
                }
            }
        };
        fetchImages();
    }, [data, imageUrls]);

    const formatComment = (comments: Comment[]) => {
        if (!comments || comments.length === 0) {
            return [];
        }

        return comments.map(comment => ({
            parent: comment,
            replies: (comment.replies || []).sort((a, b) =>
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            )
        }));
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
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
    }

    const formatNumberVN = (num: number) => {
        return num.toLocaleString("vi-VN");
    };

    const formatDateVN = (dateInput: string | Date) => {
        const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
        return date.toLocaleDateString("vi-VN");
    };


    const organizedComments = data?.comments ? formatComment(data.comments) : [];

    if (isLoading) {
        return <LoadingComponent />;
    }

    if (error) {
        return <div className="text-red-500 p-4">{error.message}</div>;
    }

    // Safe Check nếu không có data
    if (!data) {
        return <div className="text-white p-4">No data available</div>;
    }

    return (
        <div className='container px-5 py-5'>
            <title>{data.novel.title}</title>
            <div className='flex flex-col lg:flex-row gap-8'>
                {/* Cover Image và Actions */}
                <div className='flex flex-col w-full lg:w-auto'>
                    <div className='flex flex-col p-5 justify-center items-center md:items-stretch rounded-lg bg-gray-950 border border-gray-500'>
                        <Image
                            src={coverImage || defaultFallback}
                            width={350}
                            height={350}
                            alt={data?.novel?.title || 'Novel Cover'}
                            className="rounded-lg object-fill shadow-md"
                        />
                        <button
                            className='mt-4 px-4 py-2 text-lg pl-1 cursor-pointer bg-blue-500 font-bold text-white rounded-lg hover:bg-blue-600 transition-colors inline-flex items-center justify-center gap-2'
                            onClick={() => router.push(`/chapters/${data?.acts?.[0]?.chapters?.[0]?._id}`)}
                        >
                            <StepForward className='w-4.5 h-4.5 align-middle' />
                            Bắt đầu đọc
                        </button>

                        <div className='flex justify-between gap-3 md:gap-1 md:w-full mt-3'>
                            <button><div className='cursor-pointer flex px-6.5 py-3 border items-center flex-col gap-2 rounded-lg bg-gray-950 group hover:bg-gray-500 hover:transition-colors'>
                                <Heart className='w-5 h-5 text-red-500 group-hover:text-yellow-700 transition-colors duration-75' />
                                <span className='text-sm'>
                                    Yêu thích
                                </span>
                            </div></button>
                            <button><div className='cursor-pointer flex px-7.5 py-3 border items-center flex-col gap-2 rounded-lg bg-gray-950 group hover:bg-gray-500 hover:transition-colors'>
                                <BookMarked className='w-5 h-5 text-blue-500 group-hover:text-yellow-700 transition-colors duration-75' />
                                <span className='text-sm'>
                                    Đánh dấu
                                </span>
                            </div></button>
                            <button><div className='cursor-pointer flex px-8.5 py-3 border items-center flex-col gap-2 rounded-lg bg-gray-950 group hover:bg-gray-500 hover:transition-colors'>
                                <Share2 className='w-5 h-5 text-blue-500 group-hover:text-yellow-700 transition-colors duration-75' />
                                <span className='text-sm'>
                                    Chia sẻ
                                </span>
                            </div></button>
                        </div>
                    </div>
                </div>

                {/* Thông tin chính */}
                <div className='flex-1'>
                    {/* Header thông tin */}
                    <div className='mb-6 bg-gray-950 p-5 border border-gray-500 rounded-lg'>
                        <div className='flex gap-2 items-center flex-wrap mb-4'>
                            {data?.novel.genresId && !showAllGenres && data.novel.genresId.length > 3 ? (
                                data.novel.genresId.slice(0, 3).map((genre) =>
                                    <span key={genre._id} className='bg-gray-800 text-blue-300 px-3 py-1 rounded-full text-sm'>
                                        {genre.name}
                                    </span>
                                )
                            ) : (
                                data?.novel?.genresId?.map((genre) => (
                                    <span key={genre._id} className='bg-gray-800 text-blue-300 px-3 py-1 rounded-full text-sm'>
                                        {genre.name}
                                    </span>
                                ))
                            )}
                            {!showAllGenres && data?.novel?.genresId && data.novel.genresId.length > 3 &&
                                <div>
                                    <span className='bg-gray-800 text-blue-400 px-3 py-1 hover:bg-gray-600 cursor-pointer transition-colors duration-75 rounded-full text-sm'
                                        onClick={() => setShowAllGenres(true)}>
                                        ...
                                    </span>
                                </div>
                            }
                        </div>

                        <div className='flex justify-between items-start mb-4'>
                            <h1 className='text-3xl font-bold text-white'>{data?.novel?.title}</h1>

                            {/* Author Badge */}
                            {isAuthor && (
                                <div className='flex items-center gap-2 bg-gradient-to-r from-yellow-600 to-orange-600 px-3 py-1 rounded-full'>
                                    <Star className='w-4 h-4 text-white' />
                                    <span className='text-white text-sm font-medium'>Tác giả</span>
                                </div>
                            )}
                        </div>

                        <div className='flex items-center gap-3'>
                            {authorImage && (
                                <Image
                                    src={authorImage}
                                    width={100}
                                    height={100}
                                    alt={data?.novel?.authorId?.username || 'Avatar tác giả'}
                                    className="rounded-full w-13 h-13 object-cover"
                                />
                            )}
                            <div className='text-gray-300 flex flex-col'>
                                <span className='text-blue-400 font-bold text-lg'>
                                    {data?.novel?.authorId?.username ?? 'Vô danh'}
                                </span>
                                <span className='text-[0.75rem] flex items-center gap-3'>
                                    <span className='text-[1rem]'>15k người theo dõi</span> ● <span className='text-[1rem]'>{data?.novel?.authorNovelCount || 0} tác phẩm</span>
                                </span>
                            </div>
                        </div>
                        <div className='my-6 border-b-[1px] border-gray-400'></div>
                        <div className='flex flex-wrap gap-6 px-10 justify-between'>
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
                                <span className='text-lg font-bold'>{data?.novel.updatedAt ? formatDate(data.novel.updatedAt) : 'N/A'}</span>
                                <span className='text-[1rem]'>Cập nhật</span>
                            </div>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className='flex w-full mb-6'>
                        <nav className='flex w-full border border-gray-400 text-lg rounded-lg'>
                            <button
                                onClick={() => setActiveTab('description')}
                                className={`flex-1 cursor-pointer py-3 px-4 font-medium transition-all duration-200 rounded-l-lg ${activeTab === 'description'
                                    ? 'bg-gray-900 text-white'
                                    : 'bg-gray-950 text-gray-300 hover:bg-gray-700'
                                    }`}
                            >
                                Mô tả
                            </button>
                            <button
                                onClick={() => setActiveTab('chapters')}
                                className={`flex-1 cursor-pointer py-3 px-4 font-medium transition-all duration-200 border-l border-r border-gray-600 ${activeTab === 'chapters'
                                    ? 'bg-gray-900 text-white'
                                    : 'bg-gray-950 text-gray-300 hover:bg-gray-700'
                                    }`}
                            >
                                Danh sách chương
                            </button>
                            <button
                                onClick={() => setActiveTab('comments')}
                                className={`flex-1 cursor-pointer py-3 px-4 font-medium transition-all duration-200 rounded-r-lg ${activeTab === 'comments'
                                    ? 'bg-gray-900 text-white'
                                    : 'bg-gray-950 text-gray-300 hover:bg-gray-700'
                                    }`}
                            >
                                Bình luận
                            </button>
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div className='min-h-[400px]'>
                        {activeTab === 'description' && (
                            <div className='prose prose-invert max-w-none'>
                                <div className='bg-gray-950 border border-gray-400 rounded-lg p-6'>
                                    <h3 className='text-xl font-semibold mb-4 text-white'>Cốt truyện tổng quan</h3>
                                    <div className='text-gray-300 text-[1.2rem] whitespace-pre-wrap'>
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
                            <div className='space-y-2 bg-gray-950 border border-gray-400 rounded-lg'>
                                {/* Author Quick Actions in Chapters Tab */}
                                {isAuthor && (
                                    <div className='py-4 px-6 flex bg-gray-950 border-b justify-between items-center border-gray-600 rounded-lg'>
                                        <h3 className='text-lg font-semibold text-white flex items-center gap-2'>
                                            <Star className='w-5 h-5 text-yellow-500' />
                                            Quản lý tác phẩm
                                        </h3>
                                        <button
                                            onClick={handleAddAct}
                                            className='flex items-center cursor-pointer gap-2 px-4 py-2 bg-gray-950 border border-gray-400 hover:bg-gray-800 text-white rounded-lg font-medium transition-colors'
                                        >
                                            <FileText className='w-4 h-4' />
                                            Thêm phần mới
                                        </button>
                                    </div>
                                )}

                                {data?.acts && data.acts.length > 0 ? (
                                    data.acts.map((act) => (
                                        <div key={act._id} className='overflow-hidden border-b border-gray-400 last:border-b-0'>
                                            {/* Act Header - Clickable */}
                                            <div
                                                onClick={() => toggleShowChapter(act._id)}
                                                className='p-6 cursor-pointer hover:bg-gray-750 transition-colors group'
                                            >
                                                <h3 className='text-[1.15rem] font-semibold text-white flex items-center justify-between'>
                                                    <div className='flex items-center gap-2'>
                                                        <Book className='w-5 h-5' />
                                                        {act.actType ? act.actType : 'Act'} {act.actNumber} - {act.title}
                                                    </div>
                                                    <div className={`transform transition-transform duration-200 ${openActs.has(act._id) ? 'rotate-180' : 'rotate-0'
                                                        }`}>
                                                        <ChevronDown className='w-5 h-5 text-gray-400 group-hover:text-white' />
                                                    </div>
                                                </h3>
                                            </div>

                                            {/* Chapters Container - Collapsible với Act Cover */}
                                            <AnimatePresence>
                                                {openActs.has(act._id) && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                                                        className='overflow-hidden'
                                                    >
                                                        <div className='border-t border-gray-700'>
                                                            <div className='flex gap-4 p-4'>
                                                                {/* Act Cover Image */}
                                                                <div className='flex-shrink-0'>
                                                                    <Image
                                                                        src={act.publicId && imageUrls[act.publicId] ? imageUrls[act.publicId] : defaultFallback}
                                                                        width={200}
                                                                        height={280}
                                                                        alt={`Act ${act.actNumber} Cover`}
                                                                        className="rounded-lg shadow-lg object-cover border-2 border-gray-600"
                                                                    />
                                                                    <div className='mt-2 text-center'>
                                                                        <p className='text-[0.9rem] font-bold text-gray-500'>
                                                                            Bao gồm {act.chapters.length} chương
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                {/* Chapters List Container */}
                                                                <div className='flex-1 flex flex-col'>
                                                                    <div className={`grid gap-2 ${act.chapters.length > 5
                                                                        ? 'max-h-80 overflow-y-auto pr-2 scrollbar-track-gray-800'
                                                                        : ''}`}
                                                                    >
                                                                        {act.chapters.map((chapter, index) => (
                                                                            <motion.div
                                                                                key={chapter._id}
                                                                                initial={{ opacity: 0, x: -20 }}
                                                                                animate={{ opacity: 1, x: 0 }}
                                                                                transition={{ duration: 0.2, delay: index * 0.05 }}
                                                                                onClick={() => router.push(`/chapter/${chapter._id}`)}
                                                                                className='flex items-center justify-between py-3 px-4 border border-gray-400 hover:bg-gray-700 cursor-pointer transition-colors group rounded-lg hover:border-gray-600'
                                                                            >
                                                                                <div className='flex flex-col gap-1 flex-1'>
                                                                                    <span className='text-gray-200 tracking-wide text-lg font-bold group-hover:text-white transition-colors'>
                                                                                        Chương {chapter.chapterNumber}: {chapter.title}
                                                                                    </span>
                                                                                    <div className='flex gap-5 font-bold text-sm tracking-wide text-gray-400'>
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
                                                                                <StepForward className='w-6 h-6 text-gray-400 group-hover:text-blue-400 transition-colors ml-4' />
                                                                            </motion.div>
                                                                        ))}
                                                                        <div className='w-full flex items-center gap-2 justify-center py-3 px-4 border border-gray-400 hover:bg-gray-700 cursor-pointer transition-colors group rounded-lg hover:border-gray-600'
                                                                            onClick={() => { handleAddChapter(act._id) }}
                                                                        >
                                                                            <CirclePlus className='w-4 h-4' />
                                                                            <span className='text-lg'>Thêm chương</span>
                                                                        </div>
                                                                    </div>
                                                                    {/* Show scroll indicator if chapters exceed limit */}
                                                                    {act.chapters.length > 4 && (
                                                                        <div className='mt-2 text-center'>
                                                                            <p className='text-xs text-gray-500 italic'>
                                                                                Cuộn để xem thêm chương
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
                                    <div className='bg-gray-950 rounded-lg p-6 text-center'>
                                        <Book className='w-12 h-12 text-gray-400 mx-auto mb-4' />
                                        <p className='text-gray-400 text-lg'>Chưa có chương nào được đăng tải.</p>
                                        {isAuthor && (
                                            <div className='mt-4 flex justify-center gap-3'>
                                                <button
                                                    onClick={handleAddAct}
                                                    className='flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors'
                                                >
                                                    <FileText className='w-4 h-4' />
                                                    Tạo Act đầu tiên
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'comments' && (
                            <div className='rounded-lg bg-gray-950 border border-gray-600'>
                                <motion.div
                                    className="px-5 py-4 rounded-[0.8rem]"
                                    variants={itemVariants}
                                >
                                    <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                                        <MessageCircle className="w-5 h-5" />
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
                                            className="w-full p-3 bg-gray-900 border border-gray-600 rounded-md text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            rows={4}
                                            disabled={mutation.isPending}
                                        />
                                        <div className="flex justify-end mt-3">
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={handleSubmitComment}
                                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                                                disabled={mutation.isPending || !newCommentContent.trim()}
                                            >
                                                {mutation.isPending ? (
                                                    <>
                                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                                        Đang đăng...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Send className="w-4 h-4" />
                                                        Đăng bình luận
                                                    </>
                                                )}
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                </motion.div>
                                <div className='border-t-[1px] border-white mx-5.5 pb-5'></div>
                                <div className="space-y-4 mx-5 pb-5">
                                    {(!data?.comments || data.comments.length === 0) ? (
                                        <motion.div
                                            className="text-center py-8 text-gray-400"
                                            variants={itemVariants}
                                        >
                                            <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                            <p>Chưa có bình luận nào. Hãy là người đầu tiên bình luận!</p>
                                        </motion.div>
                                    ) : (
                                        <AnimatePresence>
                                            {organizedComments.map(({ parent, replies }) => (
                                                <div key={parent._id}>
                                                    {renderComment(parent, false)}

                                                    {replies.length > 0 && (
                                                        <div className="space-y-0">
                                                            {(showAllReplies.has(parent._id) ? replies : replies.slice(0, 2)).map((reply) =>
                                                                renderComment(reply, true)
                                                            )}
                                                            {replies.length > 2 && (
                                                                <motion.div
                                                                    className="ml-12 mt-2"
                                                                    initial={{ opacity: 0 }}
                                                                    animate={{ opacity: 1 }}
                                                                    transition={{ duration: 0.3 }}
                                                                >
                                                                    <motion.button
                                                                        whileHover={{ scale: 1.02 }}
                                                                        whileTap={{ scale: 0.98 }}
                                                                        onClick={() => toggleShowAllReplies(parent._id)}
                                                                        className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors rounded-md hover:bg-gray-800/50"
                                                                    >
                                                                        {showAllReplies.has(parent._id) ? (
                                                                            <>
                                                                                <ChevronUp className="w-4 h-4" />
                                                                                Ẩn bớt phản hồi
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <ChevronDown className="w-4 h-4" />
                                                                                Hiển thị {replies.length - 2} phản hồi khác
                                                                            </>
                                                                        )}
                                                                    </motion.button>
                                                                </motion.div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </AnimatePresence>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <AnimatePresence>
                {isCreateActPopupOpen && currentUser && (
                    <CreateActPopup
                        isOpen={isCreateActPopupOpen}
                        onClose={() => setIsCreateActPopupOpen(false)}
                        userId={currentUser?._id}
                        novelId={data.novel._id}
                    />
                )}
            </AnimatePresence>
            <AnimatePresence>
                {isCreateChapterPopupOpen && currentUser && (
                    <CreateChapterPopup
                        isOpen={isCreateChapterPopupOpen}
                        onClose={() => setIsCreateChapterPopupOpen(false)}
                        userId={currentUser._id}
                        novelId={data.novel._id}
                        actId={selectedActId}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}

export default NovelDetail;