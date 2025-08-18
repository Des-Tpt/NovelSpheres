'use client'
import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    User, Book, Heart, Eye, Users, Calendar, Globe, MessageCircle,
    Edit3, Settings, Star, MapPin, History, Bookmark, Loader2,
    Camera, UserPlus, Mail, ChevronRight, TrendingUp,
    CakeIcon,
    PenTool,
    Shield,
    BookOpen
} from 'lucide-react';
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
    birthday: string;
    occupation: string;
    favorites: string;
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
    const [activeSection, setActiveSection] = useState<string>('overview');
    const [isEditingBio, setIsEditingBio] = useState(false);
    const [editedBio, setEditedBio] = useState('');
    const [isFollowing, setIsFollowing] = useState(false);
    const queryClient = useQueryClient();
    const [avatar, setAvatar] = useState<string>('');
    const [coverImage, setCoverImage] = useState<string>('');
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

    // Update bio mutation
    const updateBioMutation = useMutation({
        mutationFn: async (newBio: string) => {
            // Replace with actual API call
            // return await updateProfile(userId, { bio: newBio });
            return Promise.resolve({ bio: newBio });
        },
        onSuccess: () => {
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

    // Follow/Unfollow mutation
    const followMutation = useMutation({
        mutationFn: async (action: 'follow' | 'unfollow') => {
            // Replace with actual API call
            // return await toggleFollow(userId, action);
            return Promise.resolve({ action });
        },
        onSuccess: (data) => {
            setIsFollowing(data.action === 'follow');
            // Update follower count in cache
            queryClient.setQueryData(['profile', userId], (oldData: ProfileData | undefined) => {
                if (!oldData) return oldData;
                return {
                    ...oldData,
                    profile: {
                        ...oldData.profile,
                        stats: {
                            ...oldData.profile.stats,
                            followers: oldData.profile.stats.followers + (data.action === 'follow' ? 1 : -1)
                        }
                    }
                };
            });
        }
    });

    // Initialize bio when profile loads
    useEffect(() => {
        if (profileData?.profile.bio && !isEditingBio) {
            setEditedBio(profileData.profile.bio);
        }
    }, [profileData?.profile.bio, isEditingBio]);

    // Load avatar
    useEffect(() => {
        const avatarData = profileData?.user.profile?.avatar;
        if (avatarData?.publicId && avatarData?.format) {
            getImage(avatarData.publicId, avatarData.format)
                .then(setAvatar)
                .catch(() => setAvatar(defaultFallback));
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
                if (!novel?.coverImage?.publicId) continue;

                const publicId = novel.coverImage.publicId;
                const format = novel.coverImage.format ?? 'jpg';

                if (publicId && !novelImageUrls[publicId]) {
                    try {
                        const res = await getImage(publicId, format);
                        if (res) {
                            setNovelImageUrls(prev => ({ ...prev, [publicId]: res }));
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

    const handleBioSave = () => {
        updateBioMutation.mutate(editedBio.trim());
    };

    const handleBioCancel = () => {
        setIsEditingBio(false);
        if (profileData?.profile.bio) {
            setEditedBio(profileData.profile.bio);
        }
    };

    const handleFollowToggle = () => {
        const action = isFollowing ? 'unfollow' : 'follow';
        followMutation.mutate(action);
    };

    const isOwnProfile = currentUser?._id === profileData?.user._id;

    // Enhanced Novel Card Component
    const NovelCard: React.FC<{ novel: INovel; index: number; showAuthor?: boolean }> = ({
        novel,
        index,
        showAuthor = false
    }) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            onClick={() => router.push(`/novels/${novel._id}`)}
            className="group bg-gray-800/50 hover:bg-gray-700/60 backdrop-blur-sm rounded-xl transition-all duration-300 cursor-pointer p-4 border border-gray-700/30 hover:border-gray-600/50 hover:shadow-xl hover:shadow-blue-500/10"
        >
            <div className="flex gap-4">
                {/* Cover Image */}
                <div className="relative w-16 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                    <Image
                        src={novel.coverImage?.publicId && novelImageUrls[novel.coverImage.publicId]
                            ? novelImageUrls[novel.coverImage.publicId]
                            : defaultFallback
                        }
                        fill
                        alt={novel.title || 'Novel cover'}
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Status Badge */}
                    <div className="mb-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(novel.status)}`}>
                            {handleStatus(novel.status)}
                        </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-white font-semibold text-sm mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
                        {novel.title}
                    </h3>

                    {/* Author */}
                    {showAuthor && novel.authorId && (
                        <p className="text-gray-400 text-xs mb-2">
                            by {novel.authorId.username}
                        </p>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                        <div className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            <span>{formatNumber(novel.views)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Heart className="w-3 h-3" />
                            <span>{formatNumber(novel.likes)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span>{novel.rating.toFixed(1)}</span>
                        </div>
                    </div>

                    {/* Last Update */}
                    <div className="mt-2 text-xs text-gray-500">
                        Cập nhật: {formatDate(novel.updatedAt)}
                    </div>
                </div>
            </div>
        </motion.div>
    );

    // Section Navigation
    const sections = [
        { id: 'overview', label: 'Tổng quan', icon: User },
        { id: 'novels', label: 'Truyện đã đăng', icon: Book, count: profileData?.novels.length },
        { id: 'likes', label: 'Yêu thích', icon: Heart, count: profileData?.likes.length },
        { id: 'history', label: 'Lịch sử', icon: History, count: profileData?.history.length }
    ];

    const getRoleStyle = () => {
        switch (user.role) {
            case "writer":
                return "bg-green-900/40 border-green-500 text-green-300";
            case "admin":
                return "bg-red-900/40 border-red-500 text-red-300";
            default:
                return "bg-blue-900/40 border-blue-500 text-blue-300";
        }
    };

    const getRoleIcon = () => {
        switch (user.role) {
            case "writer":
                return <PenTool className="w-4 h-4" />;
            case "admin":
                return <Shield className="w-4 h-4" />;
            default:
                return <BookOpen className="w-4 h-4" />;
        }
    };


    // Loading state
    if (profileLoading || currentUserLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
                <div className="pt-24 pb-12">
                    <div className="max-w-6xl mx-auto px-4">
                        <div className="flex items-center justify-center py-20">
                            <div className="text-center">
                                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                                <p className="text-gray-400 text-lg">Đang tải thông tin profile...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (profileError) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
                <div className="pt-24 pb-12">
                    <div className="max-w-6xl mx-auto px-4">
                        <div className="bg-red-900/30 backdrop-blur-sm rounded-2xl border border-red-500/30 p-8 text-center">
                            <div className="text-red-400 mb-4">
                                <User className="w-16 h-16 mx-auto mb-4" />
                            </div>
                            <h2 className="text-xl font-semibold text-red-300 mb-2">Không thể tải thông tin profile</h2>
                            <p className="text-red-400 text-sm mb-6">{profileError.message}</p>
                            <button
                                onClick={() => refetchProfile()}
                                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors font-medium"
                            >
                                Thử lại
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!profileData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
                <div className="pt-24 pb-12">
                    <div className="max-w-6xl mx-auto px-4">
                        <div className="text-center py-20">
                            <User className="w-20 h-20 text-gray-600 mx-auto mb-6" />
                            <h2 className="text-2xl font-semibold text-gray-400 mb-2">Không tìm thấy profile</h2>
                            <p className="text-gray-500">Profile này có thể không tồn tại hoặc đã bị xóa.</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const { user, profile, novels, likes, history } = profileData;

    return (
        <div className="min-h-screen bg-gray-950">
            {/* Cover Section */}
            <div className="border flex flex-col mt-4 mx-4 border-gray-800 rounded-sm">
                {/* Cover Photo */}
                <div className="relative group h-60 md:h-96 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 overflow-hidden">
                    <img
                        src={"https://images6.alphacoders.com/130/thumb-1920-1308597.jpg"}
                        alt="Cover"
                        className="object-cover"
                    />

                    {isOwnProfile && (
                        <div className="absolute right-5 bottom-5 z-20">
                            <button
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg transition-all duration-200 opacity-100 md:opacity-0 md:group-hover:opacity-100 "
                            >
                                <Camera className="w-5 h-5 inline-block mr-2" />
                                <span className="hidden md:inline">Thay đổi ảnh bìa</span>
                                <span className="md:hidden">Thay</span>
                            </button>
                        </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                </div>


                {/* Profile Header */}
                <div className="max-w-full md:px-5">
                    <div className="flex flex-col md:flex md:flex-row justify-between gap-6">
                        {/* Avatar */}
                        <div className='flex flex-col md:flex-row md:mb-2.5 gap-3 md:gap-6 items-center'>
                            <div className="relative -mt-16">
                                <div className={`w-35 h-35 rounded-full overflow-hidden border-2 border-gray-700 shadow-2xl bg-gray-800 ${isOwnProfile ? 'ml-1' : 'ml-0'}`}>
                                    <Image
                                        src={avatar}
                                        alt="Avatar"
                                        width={160}
                                        height={160}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                {isOwnProfile && (
                                    <button className="absolute bottom-0 right-0 w-12 h-12 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center border-3 border-white shadow-lg transition-colors group">
                                        <Camera className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                                    </button>
                                )}
                            </div>
                            <div className="flex flex-col items-center justify-center md:mt-1 md:items-start">
                                <div>
                                    <h1 className="text-4xl font-bold text-white">{user.username}</h1>
                                </div>
                                <div className={`flex items-center gap-2 px-3 py-0.5 mt-1 border rounded-full ${getRoleStyle()}`} >
                                    {getRoleIcon()}
                                    <span className="font-medium">
                                        {user.role === "writer" ? "Tác giả" : user.role === "admin" ? "Quản trị" : "Độc giả"}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className='block md:hidden border-t border-gray-500 mx-5'></div>
                        <div className="flex flex-col md:flex-row mb-6 md:mb-0 gap-3 items-center justify-center w-full md:w-auto">
                            {isOwnProfile ? (
                                <>
                                    <button className="w-50 px-4 py-2 md:px-6 md:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-500/25">
                                        <Edit3 className="w-5 h-5" />
                                        <span>Chỉnh sửa profile</span>
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={handleFollowToggle}
                                        disabled={followMutation.isPending}
                                        className={`w-50 px-4 py-2 md:px-6 md:py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-lg disabled:opacity-50 ${isFollowing
                                                ? "bg-green-400 hover:bg-green-600 text-white hover:shadow-green-400/25"
                                                : "bg-green-500 hover:bg-green-700 text-white hover:shadow-green-500/25"
                                            }`}
                                    >
                                        {followMutation.isPending ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <UserPlus className="w-5 h-5" />
                                        )}
                                        <span>
                                            {isFollowing ? "Đang theo dõi" : "Theo dõi"}
                                        </span>
                                    </button>

                                    <button className="w-50 px-4 py-2 md:px-6 md:py-3 bg-gray-700 hover:bg-gray-600 border-2 border-green-800 hover:shadow-lg hover:shadow-green-500/25 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
                                        <Mail className="w-5 h-5" />
                                        <span>Nhắn tin</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-full mx-auto px-4 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Truyện', value: formatNumber(profile.stats.totalNovels), icon: Book, color: 'blue' },
                        { label: 'Lượt xem', value: formatNumber(profile.stats.totalViews), icon: TrendingUp, color: 'green' },
                        { label: 'Theo dõi', value: formatNumber(profile.stats.followers), icon: Users, color: 'purple' },
                        { label: 'Đang theo dõi', value: formatNumber(profile.stats.following), icon: Heart, color: 'pink' }
                    ].map((stat, index) => {
                        const Icon = stat.icon;
                        const colorClasses = {
                            blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-400',
                            green: 'from-green-500/20 to-green-600/20 border-green-500/30 text-green-400',
                            purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/30 text-purple-400',
                            pink: 'from-pink-500/20 to-pink-600/20 border-pink-500/30 text-pink-400'
                        };

                        return (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={`bg-gradient-to-br ${colorClasses[stat.color as keyof typeof colorClasses]} backdrop-blur-sm rounded-xl border p-6 text-center hover:scale-105 transition-transform duration-300`}
                            >
                                <Icon className="w-8 h-8 mx-auto mb-3" />
                                <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                                <div className="text-sm text-gray-300">{stat.label}</div>
                            </motion.div>
                        );
                    })}
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar */}
                    <div className="lg:w-80 space-y-6">
                        {/* Navigation */}
                        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
                            <h3 className="text-white font-semibold mb-4">Điều hướng</h3>
                            <nav className="space-y-2">
                                {sections.map(section => {
                                    const Icon = section.icon;
                                    return (
                                        <button
                                            key={section.id}
                                            onClick={() => setActiveSection(section.id)}
                                            className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${activeSection === section.id
                                                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                                                : 'text-gray-300 hover:bg-gray-700/50'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Icon className="w-5 h-5" />
                                                <span>{section.label}</span>
                                            </div>
                                            {section.count !== undefined && (
                                                <span className="text-xs bg-gray-600 text-gray-300 px-2 py-1 rounded-full">
                                                    {section.count}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>

                        {/* Profile Info */}
                        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
                            <h3 className="text-white font-semibold mb-4">Thông tin</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center gap-3">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-300">Tham gia {formatDate(user.createdAt)}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CakeIcon className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-300">Sinh nhật {formatDate(profile.birthday)}</span>
                                </div>
                                {profile.socials.website && (
                                    <div className="flex items-center gap-3">
                                        <Globe className="w-4 h-4 text-blue-400" />
                                        <a
                                            href={profile.socials.website.startsWith('http') ? profile.socials.website : `https://${profile.socials.website}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-400 hover:text-blue-300 hover:underline truncate"
                                        >
                                            {profile.socials.website}
                                        </a>
                                    </div>
                                )}
                                {profile.socials.facebook && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-4 h-4 bg-blue-600 rounded flex items-center justify-center">
                                            <span className="text-white text-xs font-bold">f</span>
                                        </div>
                                        <span className="text-gray-300 truncate">{profile.socials.facebook}</span>
                                    </div>
                                )}
                                {profile.socials.twitter && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-4 h-4 bg-sky-500 rounded flex items-center justify-center">
                                            <span className="text-white text-xs font-bold">@</span>
                                        </div>
                                        <span className="text-gray-300 truncate">{profile.socials.twitter}</span>
                                    </div>
                                )}
                                {profile.socials.discord && (
                                    <div className="flex items-center gap-3">
                                        <MessageCircle className="w-4 h-4 text-indigo-400" />
                                        <span className="text-gray-300 truncate">{profile.socials.discord}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1">
                        <AnimatePresence mode="wait">
                            {activeSection === 'overview' && (
                                <motion.div
                                    key="overview"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-8"
                                >
                                    {/* Recent Activity */}
                                    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
                                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                            <TrendingUp className="w-6 h-6 text-green-500" />
                                            Hoạt động gần đây
                                        </h2>

                                        <div className="space-y-6">
                                            {/* Latest Novels */}
                                            {novels.length > 0 && (
                                                <div>
                                                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center justify-between">
                                                        <span className="flex items-center gap-2">
                                                            <Book className="w-5 h-5 text-blue-500" />
                                                            Truyện mới nhất
                                                        </span>
                                                        {novels.length > 3 && (
                                                            <button
                                                                onClick={() => setActiveSection('novels')}
                                                                className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                                                            >
                                                                Xem tất cả
                                                                <ChevronRight className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </h3>
                                                    <div className="space-y-3">
                                                        {novels.slice(0, 3).map((novel, index) => (
                                                            <NovelCard key={novel._id} novel={novel} index={index} />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Recent Likes */}
                                            {likes.length > 0 && (
                                                <div>
                                                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center justify-between">
                                                        <span className="flex items-center gap-2">
                                                            <Heart className="w-5 h-5 text-pink-500" />
                                                            Yêu thích gần đây
                                                        </span>
                                                        {likes.length > 3 && (
                                                            <button
                                                                onClick={() => setActiveSection('likes')}
                                                                className="text-pink-400 hover:text-pink-300 text-sm flex items-center gap-1"
                                                            >
                                                                Xem tất cả
                                                                <ChevronRight className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </h3>
                                                    <div className="space-y-3">
                                                        {likes.slice(0, 3).map((like, index) => (
                                                            <NovelCard
                                                                key={like._id}
                                                                novel={like.novelId}
                                                                index={index}
                                                                showAuthor={true}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Reading History */}
                                            {history.length > 0 && (
                                                <div>
                                                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center justify-between">
                                                        <span className="flex items-center gap-2">
                                                            <History className="w-5 h-5 text-green-500" />
                                                            Đọc gần đây
                                                        </span>
                                                        {history.length > 3 && (
                                                            <button
                                                                onClick={() => setActiveSection('history')}
                                                                className="text-green-400 hover:text-green-300 text-sm flex items-center gap-1"
                                                            >
                                                                Xem tất cả
                                                                <ChevronRight className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </h3>
                                                    <div className="space-y-3">
                                                        {history.slice(0, 3).map((novel, index) => (
                                                            <NovelCard
                                                                key={novel._id}
                                                                novel={novel}
                                                                index={index}
                                                                showAuthor={true}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Empty State */}
                                            {novels.length === 0 && likes.length === 0 && history.length === 0 && (
                                                <div className="text-center py-12">
                                                    <User className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                                    <p className="text-gray-400 text-lg">Chưa có hoạt động nào</p>
                                                    <p className="text-gray-500 text-sm mt-2">
                                                        {isOwnProfile ? 'Bắt đầu đọc hoặc đăng truyện để xem hoạt động ở đây' : 'Người dùng này chưa có hoạt động nào'}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeSection === 'novels' && (
                                <motion.div
                                    key="novels"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6"
                                >
                                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                        <Book className="w-6 h-6 text-blue-500" />
                                        Truyện đã đăng
                                        <span className="bg-blue-600 text-white text-sm px-3 py-1 rounded-full">
                                            {novels.length}
                                        </span>
                                    </h2>

                                    {novels.length > 0 ? (
                                        <div className="grid gap-4 md:grid-cols-2">
                                            {novels.map((novel, index) => (
                                                <NovelCard key={novel._id} novel={novel} index={index} />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-16">
                                            <Book className="w-20 h-20 text-gray-600 mx-auto mb-6" />
                                            <h3 className="text-xl font-semibold text-gray-400 mb-2">Chưa đăng truyện nào</h3>
                                            <p className="text-gray-500">
                                                {isOwnProfile ? 'Bắt đầu viết và đăng truyện đầu tiên của bạn' : 'Người dùng này chưa đăng truyện nào'}
                                            </p>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {activeSection === 'likes' && (
                                <motion.div
                                    key="likes"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6"
                                >
                                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                        <Heart className="w-6 h-6 text-pink-500" />
                                        Truyện yêu thích
                                        <span className="bg-pink-600 text-white text-sm px-3 py-1 rounded-full">
                                            {likes.length}
                                        </span>
                                    </h2>

                                    {likes.length > 0 ? (
                                        <div className="grid gap-4 md:grid-cols-2">
                                            {likes.map((like, index) => (
                                                <NovelCard
                                                    key={like._id}
                                                    novel={like.novelId}
                                                    index={index}
                                                    showAuthor={true}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-16">
                                            <Heart className="w-20 h-20 text-gray-600 mx-auto mb-6" />
                                            <h3 className="text-xl font-semibold text-gray-400 mb-2">Chưa có truyện yêu thích</h3>
                                            <p className="text-gray-500">
                                                {isOwnProfile ? 'Thả tim những truyện bạn yêu thích để xem ở đây' : 'Người dùng này chưa yêu thích truyện nào'}
                                            </p>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {activeSection === 'history' && (
                                <motion.div
                                    key="history"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6"
                                >
                                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                        <History className="w-6 h-6 text-green-500" />
                                        Lịch sử đọc
                                        <span className="bg-green-600 text-white text-sm px-3 py-1 rounded-full">
                                            {history.length}
                                        </span>
                                    </h2>

                                    {history.length > 0 ? (
                                        <div className="grid gap-4 md:grid-cols-2">
                                            {history.map((novel, index) => (
                                                <NovelCard
                                                    key={novel._id}
                                                    novel={novel}
                                                    index={index}
                                                    showAuthor={true}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-16">
                                            <History className="w-20 h-20 text-gray-600 mx-auto mb-6" />
                                            <h3 className="text-xl font-semibold text-gray-400 mb-2">Chưa có lịch sử đọc</h3>
                                            <p className="text-gray-500">
                                                {isOwnProfile ? 'Bắt đầu đọc truyện để xem lịch sử ở đây' : 'Lịch sử đọc của người dùng này không công khai'}
                                            </p>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default ProfilePage;