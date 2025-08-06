'use client'
import { getNovelById } from '@/action/novelActions';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import LoadingComponent from '../ui/Loading';
import { use, useEffect, useState } from 'react';
import getImage from '@/action/imageActions';
import Image from 'next/image';
import handleStatus from '@/utils/handleStatus';
import { Book, BookMarked, Heart, Share2, StepForward, Calendar, Eye, Clock, BookOpenIcon, Star } from 'lucide-react';

const cloudname = process.env.NEXT_PUBLIC_CLOUDINARY_NAME! as string;
const defaultFallback = `https://res.cloudinary.com/${cloudname}/image/upload/LightNovel/BookCover/96776418_p0_qov0r8.png`;

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
            { avatar?: 
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
}

interface Act {
    _id: string;
    title: string;
    actNumber: string;
    chapters: Chapter[];
}

const NovelDetail = () => {
    const params = useParams();
    const router = useRouter();
    const novelId = params.id;
    const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
    const [showAllGenres, setShowAllGenres] = useState(false);
    const [authorImage, setAuthorImage] = useState<string>('');
    const [coverImage, setCoverImage] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'description' | 'chapters' | 'comments'>('description');

    const { data, isLoading, error } = useQuery<{novel: Novel, comments: Comment[], acts : Act[]}>({
        queryKey: ['novelDetail', novelId],
        queryFn: () => getNovelById(novelId as string),
    });

    useEffect(() => {
        if (!Array.isArray(data?.comments)) return;
        
        data.comments.map(async (comment) => {
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
                comment.replies.map(async (reply) => {
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

    const formatComment = (comments: Comment[]) => {
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

    const getTotalChapters = () => {
        return data?.acts?.reduce((total, act) => total + act.chapters.length, 0) || 0;
    };

    if (data?.comments && data.comments.length > 0) {
        const organizedComments = formatComment(data?.comments!);
    }

    if (isLoading) {
        return <LoadingComponent />;
    }

    if (error) {
        return <div>{error.message}</div>;
    }

    return (
        <div className='container mx-auto px-5 py-5'>
            <div className='flex flex-col lg:flex-row gap-8'>
                {/* Cover Image và Actions */}
                <div className='flex flex-col w-full lg:w-auto'>
                    <div className='flex flex-col p-5 rounded-lg bg-gray-900'>
                        <Image 
                            src={coverImage || defaultFallback}
                            width={350}
                            height={350}
                            alt={data?.novel?.title || 'Novel Cover'}
                            className="rounded-lg shadow-md"
                        />
                        <button
                            className='mt-4 px-4 py-2 text-lg pl-1 bg-blue-500 font-bold text-white rounded-lg hover:bg-blue-600 transition-colors inline-flex items-center justify-center gap-2'
                            onClick={() => router.push(`/chapters/${data?.acts?.[0]?.chapters?.[0]?._id}`)}
                        >
                            <StepForward className='w-4.5 h-4.5 align-middle' />
                            Bắt đầu đọc
                        </button>
                        <div className='flex justify-between gap-1 w-full mt-3'>
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
                    <div className='mb-6 bg-gray-900 p-5 rounded-lg'>
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
                            {!showAllGenres && 
                                <div>
                                    <span className='bg-gray-800 text-blue-400 px-3 py-1 hover:bg-gray-600 cursor-pointer transition-colors duration-75 rounded-full text-sm'
                                        onClick={() => setShowAllGenres(true)}>
                                        ...
                                    </span>
                                </div>
                            }
                        </div>
                        
                        <h1 className='text-3xl font-bold mb-4 text-white'>{data?.novel?.title}</h1>
                        
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
                                    {data?.novel?.authorId?.username}
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
                                <span className='text-[0.95rem]'>Số chương</span>
                            </div>
                            <div className='flex flex-col justify-center items-center'>
                                <Heart className='w-5 h-5 mb-1 text-red-400' />
                                <span className='text-lg font-bold'>{data?.novel.likes && data.novel.likes > 100 ? data.novel.likes : '9.6K'}</span>
                                <span className='text-[0.95rem]'>Lượt theo dõi</span>
                            </div>
                            <div className='flex flex-col justify-center items-center'>
                                <Star className='w-5 h-5 mb-1 text-yellow-500' />
                                <span className='text-lg font-bold'>4.6</span>
                                <span className='text-[0.95rem]'>Đánh giá</span>
                            </div>
                            <div className='flex flex-col justify-center items-center'>
                                <Eye className='w-5 h-5 mb-1 text-green-400' />
                                <span className='text-lg font-bold'>{data?.novel.views && data.novel.views > 1 ? data?.novel.views : '1.7M'}</span>
                                <span className='text-[0.95rem]'>Lượt xem</span>
                            </div>
                            <div className='flex flex-col justify-center items-center'>
                                <Clock className='w-5 h-5 mb-1 text-yellow-400' />
                                <span className='text-lg font-bold'>{formatDate(data?.novel.updatedAt!)}</span>
                                <span className='text-[0.95rem]'>Cập nhật</span>
                            </div>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className='border-b border-gray-700 mb-6'>
                        <nav className='flex space-x-8'>
                            <button
                                onClick={() => setActiveTab('description')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                                    activeTab === 'description'
                                        ? 'border-blue-500 text-blue-400'
                                        : 'border-transparent text-gray-400 hover:text-gray-300'
                                }`}
                            >
                                Mô tả
                            </button>
                            <button
                                onClick={() => setActiveTab('chapters')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                                    activeTab === 'chapters'
                                        ? 'border-blue-500 text-blue-400'
                                        : 'border-transparent text-gray-400 hover:text-gray-300'
                                }`}
                            >
                                Danh sách chương ({getTotalChapters()})
                            </button>
                            <button
                                onClick={() => setActiveTab('comments')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                                    activeTab === 'comments'
                                        ? 'border-blue-500 text-blue-400'
                                        : 'border-transparent text-gray-400 hover:text-gray-300'
                                }`}
                            >
                                Bình luận ({data?.comments?.length || 0})
                            </button>
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div className='min-h-[400px]'>
                        {activeTab === 'description' && (
                            <div className='prose prose-invert max-w-none'>
                                <div className='bg-gray-800 rounded-lg p-6'>
                                    <h3 className='text-xl font-semibold mb-4 text-white'>Mô tả truyện</h3>
                                    <div className='text-gray-300 leading-relaxed whitespace-pre-wrap'>
                                        {data?.novel?.description || 'Chưa có mô tả cho truyện này.'}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'chapters' && (
                            <div className='space-y-6'>
                                {data?.acts && data.acts.length > 0 ? (
                                    data.acts.map((act) => (
                                        <div key={act._id} className='bg-gray-800 rounded-lg p-6'>
                                            <h3 className='text-xl font-semibold mb-4 text-white flex items-center gap-2'>
                                                <Book className='w-5 h-5' />
                                                {act.title} - Act {act.actNumber}
                                            </h3>
                                            <div className='grid gap-2'>
                                                {act.chapters.map((chapter) => (
                                                    <div
                                                        key={chapter._id}
                                                        onClick={() => router.push(`/chapters/${chapter._id}`)}
                                                        className='flex items-center justify-between p-3 bg-gray-700 hover:bg-gray-600 rounded-lg cursor-pointer transition-colors group'
                                                    >
                                                        <div className='flex items-center gap-3'>
                                                            <span className='text-sm text-gray-400 font-mono w-12'>
                                                                #{chapter.chapterNumber}
                                                            </span>
                                                            <span className='text-gray-200 group-hover:text-white'>
                                                                {chapter.title}
                                                            </span>
                                                        </div>
                                                        <StepForward className='w-4 h-4 text-gray-400 group-hover:text-blue-400' />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className='bg-gray-800 rounded-lg p-6 text-center'>
                                        <Book className='w-12 h-12 text-gray-400 mx-auto mb-4' />
                                        <p className='text-gray-400'>Chưa có chương nào được đăng tải.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'comments' && (
                            <div className='bg-gray-800 rounded-lg p-6'>
                                <h3 className='text-xl font-semibold mb-4 text-white'>Bình luận</h3>
                                <p className='text-gray-400'>Phần bình luận sẽ được thêm vào sau...</p>
                                {/* Bạn sẽ thêm component bình luận vào đây */}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default NovelDetail;