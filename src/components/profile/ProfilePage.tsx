'use client'
import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Book, Heart, Eye, Users, Calendar, Globe, MessageCircle, Edit3, Settings, Star, MapPin, History, Bookmark, Loader2 } from 'lucide-react';
import { getProfile } from '@/action/profileAction';
import { getUserFromCookies } from '@/action/userAction';
import getImage from '@/action/imageActions';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import stripHtml from '@/utils/stripHtml';
import handleStatus from '@/utils/handleStatus';
import getStatusColor from '@/utils/getStatusColor';
import { useRouter } from 'next/navigation';

const cloudname = process.env.NEXT_PUBLIC_CLOUDINARY_NAME! as string;
const defaultFallback = `https://res.cloudinary.com/${cloudname}/image/upload/LightNovel/BookCover/96776418_p0_qov0r8.png`;

interface IUser {
    _id: string;
    username: string;
    email: string;
    role: 'reader' | 'admin' | 'writer';
    profile?: {
        bio?: string;
        avatar?: {
            publicId: string;
            format: string;
        };
    };
    createdAt: string;
}

interface IProfile {
    userId: string;
    bio: string;
    socials: {
        facebook?: string;
        twitter?: string;
        discord?: string;
        website?: string;
    };
    stats: {
        followers: number;
        following: number;
        totalViews: number;
        totalNovels: number;
    };
    birthday: Date;
    occupation: string;
    favorites: string,
    createdAt: string;
    updatedAt: string;
}

interface INovel {
    _id: string;
    title: string;
    authorId?: { username: string };
    description: string;
    coverImage?: {
        publicId?: string;
        format?: string;
    };
    genresId?: Array<{ _id: string; name: string }>;
    status: 'Ongoing' | 'Completed' | 'Hiatus';
    views: number;
    likes: number;
    rating: number;
    ratingsCount: number;
    createdAt: string;
    updatedAt: string;
}

interface ILike {
    _id: string;
    userId: string;
    novelId: INovel;
    createdAt: string;
}

interface IHistory {
    _id: string;
    userId: string;
    novelId: INovel;
    createdAt: string;
}

interface ProfileData {
    user: IUser;
    profile: IProfile;
    novels: INovel[];
    likes: ILike[];
    history: INovel[];
}

interface CurrentUser {
    _id: string;
    username: string;
    email: string;
    publicId: string;
    format: string;
    role: string;
}

interface PageProps {
    userId: string;
}

const ProfilePage: React.FC<PageProps> = ({ userId }) => {
    const router = useRouter();
    const [isEditingBio, setIsEditingBio] = useState(false);
    const [editedBio, setEditedBio] = useState('');
    const queryClient = useQueryClient();
    const [avatar, setAvatar] = useState<string>('');
    const [novelImageUrls, setNovelImageUrls] = useState<Record<string, string>>({});

    const { data: profileData, isLoading: profileLoading, error: profileError, refetch: refetchProfile } = useQuery<ProfileData>({
        queryKey: ['profile', userId],
        queryFn: () => getProfile(userId),
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 3,
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
        enabled: !!userId,
    });

    const { data: currentUser, isLoading: currentUserLoading } = useQuery<CurrentUser | null>({
        queryKey: ['currentUser'],
        queryFn: async () => {
            try {
                const response = await getUserFromCookies();
                return response?.user || null;
            } catch (error) {
                return null;
            }
        },
        staleTime: 10 * 60 * 1000,
        gcTime: 15 * 60 * 1000,
    });

    // Mutation để update bio
    const updateBioMutation = useMutation({
        mutationFn: async (newBio: string) => {
            // Thay bằng API call thực tế của bạn
            // return await updateProfile(userId, { bio: newBio });
        },
        onSuccess: (updatedData) => {
            queryClient.setQueryData(['profile', userId], (oldData: ProfileData | undefined) => {
                if (!oldData) return oldData;
                return {
                    ...oldData,
                    profile: {
                        ...oldData.profile,
                        bio: editedBio
                    }
                };
            });
            setIsEditingBio(false);
        },
        onError: (error) => {
            console.error('Failed to update bio:', error);
        }
    });

    // Set edited bio khi profile data load
    useEffect(() => {
        if (profileData?.profile.bio && !editedBio) {
            setEditedBio(profileData.profile.bio);
        }
    }, [profileData?.profile.bio]);

    // Load avatar
    useEffect(() => {
        const avatar = profileData?.user.profile?.avatar;
        if (avatar?.publicId && avatar?.format) {
            getImage(avatar.publicId, avatar.format)
                .then((res) => setAvatar(res))
        } else {
            setAvatar(defaultFallback);
        }
    }, [profileData]);

    // Load novel cover images
    useEffect(() => {
        if (!profileData) return;

        const allNovels = [
            ...profileData.novels,
            ...profileData.history,
            ...profileData.likes.map(like => like.novelId)
        ];

        const fetchNovelImages = async () => {
            for (const novel of allNovels) {
                if (!novel || !novel.coverImage?.publicId) continue;

                const publicId = novel.coverImage.publicId;
                const format = novel.coverImage.format ?? 'jpg';

                if (publicId && !novelImageUrls[publicId]) {
                    try {
                        const res = await getImage(publicId, format);
                        if (res) {
                            setNovelImageUrls((prev) => ({ ...prev, [publicId]: res }));
                        }
                    } catch (error) {
                        console.error('Error fetching image for', publicId, error);
                    }
                }
            }
        };
        fetchNovelImages();
    }, [profileData, novelImageUrls]);

    const formatNumber = (num: number): string => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor(diff / (1000 * 60 * 60));

        if (hours < 1) return 'Vừa xong';
        if (hours < 24) return `${hours} giờ trước`;
        if (days === 1) return 'Hôm qua';
        if (days < 7) return `${days} ngày trước`;
        return date.toLocaleDateString('vi-VN');
    };

    const handleBioSave = async () => {
        updateBioMutation.mutate(editedBio);
    };

    const handleBioCancel = () => {
        setIsEditingBio(false);
        if (profileData?.profile.bio) {
            setEditedBio(profileData.profile.bio);
        }
    };

    // Novel Card Component theo kiểu list như trong ảnh
    const NovelCard = ({ novel, index }: { novel: INovel, index: number }) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            onClick={() => router.push(`/novels/${novel._id}`)}
            className="bg-gray-800/50 hover:bg-gray-700/70 rounded-lg transition-all duration-300 cursor-pointer group p-4 flex gap-4"
        >
            {/* Cover Image */}
            <div className="w-20 h-28 flex-shrink-0 rounded-lg overflow-hidden">
                <Image
                    src={novel.coverImage?.publicId && novelImageUrls[novel.coverImage.publicId]
                        ? novelImageUrls[novel.coverImage.publicId]
                        : defaultFallback
                    }
                    height={112}
                    width={80}
                    alt={novel.title || 'Novel cover'}
                    className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                {/* Status Badge */}
                <div className="mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(novel.status)}`}>
                        {handleStatus(novel.status)}
                    </span>
                </div>

                {/* Title */}
                <h3 className="text-white font-bold text-lg mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
                    {novel.title}
                </h3>

                {/* Info */}
                <div className="space-y-1 text-sm text-gray-400">
                    <div>
                        <span className="text-gray-500">Tình trạng:</span>{' '}
                        <span className="text-gray-300">{handleStatus(novel.status)}</span>
                    </div>
                    <div>
                        <span className="text-gray-500">Lần cuối:</span>{' '}
                        <span className="text-gray-300">{formatDate(novel.updatedAt)}</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );

    // Loading state
    if (profileLoading || currentUserLoading) {
        return (
            <div className="min-h-screen pt-20 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                            <p className="text-gray-400">Đang tải thông tin...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (profileError) {
        return (
            <div className="min-h-screen pt-20 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="bg-red-900/50 backdrop-blur-sm rounded-2xl border border-red-500/50 p-6 text-center">
                        <p className="text-red-300 mb-4">Có lỗi xảy ra khi tải thông tin profile</p>
                        <p className="text-red-400 text-sm">{profileError.message}</p>
                        <button
                            onClick={() => refetchProfile()}
                            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors"
                        >
                            Thử lại
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // No data state
    if (!profileData) {
        return (
            <div className="min-h-screen pt-20 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="text-center py-12">
                        <User className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400">Không tìm thấy thông tin profile</p>
                    </div>
                </div>
            </div>
        );
    }

    const { user, profile, novels, likes, history } = profileData;

    return (
        <div className="min-h-screen mt-20 bg-gray-950">
            {/* Cover Photo */}
            <div className="h-64 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 relative">
                <img
                    src="https://moewalls.com/wp-content/uploads/2025/03/miku-summer-thumb.jpg"
                    alt="Cover"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/30"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="flex flex-col lg:flex-row gap-8">

                    {/* Left Sidebar - Profile Info */}
                    <div className="lg:w-80 flex-shrink-0">
                        {/* Profile Card */}
                        <div className="bg-gray-900 rounded-lg p-6 mb-6 border border-gray-700">
                            {/* Avatar & Basic Info */}
                            <div className="text-center mb-6">
                                <div className="w-30 h-30 mx-auto rounded-full overflow-hidden border-4 border-gray-700">
                                    {user.profile?.avatar ? (
                                        <img
                                            src={avatar}
                                            alt="Avatar"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                                            {user.username.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>

                                <h1 className="text-2xl font-bold text-white mb-2">{user.username}</h1>

                                <div className="flex items-center justify-center gap-2 mb-3">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                    <span className="text-blue-400 text-sm font-medium">
                                        {user.role === 'writer' ? 'Tác giả' : user.role === 'admin' ? 'Quản trị' : 'Độc giả'}
                                    </span>
                                </div>

                                <button className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-full font-medium transition-colors">
                                    Liên hệ
                                </button>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-4 mb-6 text-center">
                                <div className="bg-gray-700/50 rounded-lg p-3">
                                    <div className="text-2xl font-bold text-white mb-1">{profile.stats.totalNovels}</div>
                                    <div className="text-sm text-gray-400">Truyện đã đăng</div>
                                </div>
                                <div className="bg-gray-700/50 rounded-lg p-3">
                                    <div className="text-2xl font-bold text-white mb-1">{profile.stats.following}</div>
                                    <div className="text-sm text-gray-400">Đang theo dõi</div>
                                </div>
                                <div className="bg-gray-700/50 rounded-lg p-3 col-span-2">
                                    <div className="text-2xl font-bold text-white mb-1">{profile.stats.followers}</div>
                                    <div className="text-sm text-gray-400">Người theo dõi</div>
                                </div>
                            </div>

                            {/* Bio */}
                            <div className="mb-6">
                                <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    Giới thiệu:
                                </h3>
                                {isEditingBio ? (
                                    <div className="space-y-3">
                                        <textarea
                                            value={editedBio}
                                            onChange={(e) => setEditedBio(e.target.value)}
                                            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                            rows={3}
                                            maxLength={500}
                                            placeholder="Viết bio của bạn..."
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleBioSave}
                                                disabled={updateBioMutation.isPending}
                                                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                            >
                                                {updateBioMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                                                Lưu
                                            </button>
                                            <button
                                                onClick={handleBioCancel}
                                                disabled={updateBioMutation.isPending}
                                                className="px-4 py-2 bg-gray-600 text-gray-300 rounded-lg hover:bg-gray-500 transition-colors disabled:opacity-50"
                                            >
                                                Hủy
                                            </button>
                                        </div>
                                        {updateBioMutation.error && (
                                            <p className="text-red-400 text-sm">
                                                Lỗi: {updateBioMutation.error.message}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="group cursor-pointer" onClick={() => currentUser?._id === user._id && setIsEditingBio(true)}>
                                        <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-line mb-2">
                                            {profile.bio || 'Chưa có bio...'}
                                        </div>
                                        {currentUser?._id === user._id && (
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Edit3 className="w-4 h-4 text-gray-500" />
                                                <span className="text-xs text-gray-500">Chỉnh sửa bio</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Social Links & Info */}
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center gap-2 text-gray-400">
                                    <Calendar className="w-4 h-4" />
                                    <span>Tham gia {formatDate(user.createdAt)}</span>
                                </div>
                                {profile.socials.website && (
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <Globe className="w-4 h-4 text-blue-400" />
                                        <a
                                            href={profile.socials.website.startsWith('http') ? profile.socials.website : `https://${profile.socials.website}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-400 hover:text-blue-300 cursor-pointer"
                                        >
                                            {profile.socials.website}
                                        </a>
                                    </div>
                                )}
                                {profile.socials.facebook && (
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <div className="w-4 h-4 bg-blue-600 rounded flex items-center justify-center">
                                            <span className="text-white text-xs font-bold">f</span>
                                        </div>
                                        <span className="text-gray-300">{profile.socials.facebook}</span>
                                    </div>
                                )}
                                {profile.socials.twitter && (
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <div className="w-4 h-4 bg-sky-500 rounded flex items-center justify-center">
                                            <span className="text-white text-xs font-bold">@</span>
                                        </div>
                                        <span className="text-gray-300">{profile.socials.twitter}</span>
                                    </div>
                                )}
                                {profile.socials.discord && (
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <MessageCircle className="w-4 h-4 text-indigo-400" />
                                        <span className="text-gray-300">{profile.socials.discord}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Content - Novel Sections */}
                    <div className="flex-1 space-y-8">

                        {/* Truyện đã đăng */}
                        <div className="">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                        <Book className="w-7 h-7 text-blue-500" />
                                        Truyện đã đăng
                                        <span className="bg-blue-600 text-white text-sm px-3 py-1 rounded-full">
                                            {novels.length}
                                        </span>
                                    </h2>
                                    {novels.length > 4 && (
                                        <button className="text-blue-400 hover:text-blue-300 text-sm font-medium px-4 py-2 bg-blue-600/10 rounded-lg hover:bg-blue-600/20 transition-colors">
                                            Xem tất cả
                                        </button>
                                    )}
                                </div>

                                {novels.length > 0 ? (
                                    <div className="space-y-3 md:grid md:grid-cols-2 md:gap-x-3">
                                        {novels.slice(0, 4).map((novel, index) => (
                                            <NovelCard key={novel._id} novel={novel} index={index} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-16">
                                        <Book className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                        <p className="text-gray-400 text-lg">Chưa đăng truyện nào</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Lịch sử đọc */}
                        <div className="">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                        <History className="w-7 h-7 text-green-500" />
                                        Lịch sử đọc
                                        <span className="bg-green-600 text-white text-sm px-3 py-1 rounded-full">
                                            {history.length}
                                        </span>
                                    </h2>
                                    {history.length > 4 && (
                                        <button className="text-green-400 hover:text-green-300 text-sm font-medium px-4 py-2 bg-green-600/10 rounded-lg hover:bg-green-600/20 transition-colors">
                                            Xem tất cả
                                        </button>
                                    )}
                                </div>
                                {history.length > 0 ? (
                                    <div className="space-y-3 md:grid md:grid-cols-2 md:gap-x-3">
                                        {history.slice(0, 4).map((novel, index) => (
                                            <NovelCard key={novel._id} novel={novel} index={index} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-16">
                                        <History className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                        <p className="text-gray-400 text-lg">Chưa có lịch sử đọc</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Yêu thích */}
                        <div className="">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                        <Heart className="w-7 h-7 text-pink-500" />
                                        Yêu thích
                                        <span className="bg-pink-600 text-white text-sm px-3 py-1 rounded-full">
                                            {likes.length}
                                        </span>
                                    </h2>
                                    {likes.length > 4 && (
                                        <button className="text-pink-400 hover:text-pink-300 text-sm font-medium px-4 py-2 bg-pink-600/10 rounded-lg hover:bg-pink-600/20 transition-colors">
                                            Xem tất cả
                                        </button>
                                    )}
                                </div>

                                {likes.length > 0 ? (
                                    <div className="space-y-3 md:grid md:grid-cols-2 md:gap-x-3">
                                        {likes.slice(0, 4).map((like, index) => (
                                            <NovelCard key={like._id} novel={like.novelId} index={index} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-16">
                                        <Heart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                        <p className="text-gray-400 text-lg">Chưa có truyện yêu thích</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;