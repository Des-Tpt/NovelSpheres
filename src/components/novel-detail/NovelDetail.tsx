'use client'
import { getNovelById } from '@/action/novelActions';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import LoadingComponent from '../ui/Loading';
import { use, useEffect, useState } from 'react';
import getImage from '@/action/imageActions';
import Image from 'next/image';
import handleStatus from '@/utils/handleStatus';

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
    status: string;
    updatedAt: string;
    views: number;
    coverImage?: { 
        publicId: string; 
        format: string 
    };
    genresId?: Genres[];
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
    const [authorImage, setAuthorImage] = useState<string>('');
    const [coverImage, setCoverImage] = useState<string>('');
    const [commentImageUrls, setCommentImageUrls] = useState<Record<string, string>>({});

    const { data, isLoading, error } = useQuery<{novel: Novel, comments: Comment[], acts : Act[]}>({
        queryKey: ['novelDetail', novelId],
        queryFn: () => getNovelById(novelId as string),
    });

    useEffect(() => {
        if (!Array.isArray(data?.comments)) return;
        
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
                    console.error('Error loading comment avatar:', error);
                }
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
                    console.error('Error loading author avatar:', error);
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
                    console.error('Error loading cover image:', error);
                    setCoverImage(defaultFallback);
                });
        } else {
            setCoverImage(defaultFallback);
        }
    }, [data?.novel?.coverImage]);

    useEffect(() => {
        if (!Array.isArray(data?.comments)) return;
        
        data.comments.forEach(async (comment) => {
            if (comment.replyToUserId?._id) {
                const publicId = comment.userId.profile?.avatar?.publicId;
                const format = comment.userId.profile?.avatar?.format;
                
                if (publicId && format) {
                    try {
                        const res = await getImage(publicId, format);
                        if (res) {
                            setCommentImageUrls((prev) => ({ ...prev, [comment.userId._id]: res }));
                        }
                    } catch (error) {
                        console.error('Error loading reply avatar:', error);
                    }
                }
            }
        });
    }, [data?.comments]);

    console.log("Novel Detail Data:", data);

    if (isLoading) {
        return <LoadingComponent />;
    }

    if (error) {
        return <div>{error.message}</div>;
    }

    return (
        <div className='container mx-auto px-4 py-8'>
            <div className='flex'>
                <div className='flex flex-col'>
                    <Image 
                        src={coverImage || defaultFallback}
                        width={200}
                        height={280}
                        alt={data?.novel?.title || 'Novel Cover'}
                        className="post-image w-12 h-12 md:w-15 md:h-15 rounded-2xl md:rounded-4xl object-cover object-top transition-transform duration-200 hover:scale-105"
                    />
                    <button
                        className='mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors'
                        onClick={() => router.push(`/chapters/${data?.acts?.[0]?.chapters?.[0]?._id}`)}>
                        Đọc từ đầu
                    </button>
                </div>
                <div className='flex flex-col gap-5'>
                    <div className='flex gap-1.5 items-center flex-wrap'>
                        {data?.novel?.genresId?.map((genre) => (
                            <div key={genre._id} className='text-sm text-gray-600'>
                                {genre.name}
                            </div>
                        ))}
                        <div>{handleStatus(data?.novel?.status || 'Không xác định')}</div>
                    </div>
                    <div className='flex flex-col'>
                        <h1>{data?.novel?.title}</h1>
                        <div className='flex'>
                            {authorImage && (
                                <Image
                                    src={authorImage}
                                    width={40}
                                    height={40} 
                                    alt={data?.novel?.authorId?.username || 'Avatar tác giả'}    
                                />
                            )}
                            <div className='flex'>
                                <span className='ml-2 text-sm text-gray-600'>
                                    {data?.novel?.authorId?.username}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default NovelDetail;