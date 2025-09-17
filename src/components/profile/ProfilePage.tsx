'use client'
import React, { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    User, Book, Heart, Eye, Users, Calendar, Globe, MessageCircle,
    Edit3, Star, Bookmark, Loader2,
    Camera, UserPlus, Mail, ChevronRight, TrendingUp,
    CakeIcon,
    PenTool,
    Shield,
    BookOpen,
    Trophy,
    Loader
} from 'lucide-react';
import { getProfile } from '@/action/profileAction';
import { getUserFromCookies } from '@/action/userAction';
import getImage, { editAvatar } from '@/action/imageActions';
import { motion, AnimatePresence } from 'framer-motion';
import UpdateProfilePopup from './UpdateProfile';
import CustomImage from '../ui/CustomImage';
import LoadingComponent from '../ui/Loading';
import NovelCard from './NovelCard';
import { followAction } from '@/action/followAction';
import { notifyError, notifySuccess } from '@/utils/notify';
import { useUserStore } from '@/store/avatarUserStore';
import handleRole from '@/utils/handleRole';

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
    coverImage?: {
        publicId: string;
        format: string;
    };
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

interface ProfileData {
    user: IUser;
    profile: IProfile;
    novels: INovel[];
    likes: ILike[];
    isFollowed: boolean
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
    const [activeSection, setActiveSection] = useState<string>('overview');
    const [isFollowing, setIsFollowing] = useState(false);
    const { avatar, setAvatar } = useUserStore();
    const [avatarUrl, setAvatarUrl] = useState<string>('');
    const [coverImage, setCoverImage] = useState<string>(defaultFallback);
    const [isOpenEditProfile, setIsOpenEditProfile] = useState(false);
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement | null>(null);

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

    // Follow/Unfollow mutation
    const followMutation = useMutation({
        mutationFn: followAction,
        onSuccess: (res) => {
            setIsFollowing(res.isFollowing);
            notifySuccess(res.message || (res.isFollowing ? 'Theo dõi thành công!' : 'Hủy theo dõi thành công!'));
            queryClient.setQueryData(['profile', userId], (oldData: ProfileData | undefined) => {
                if (!oldData) return oldData;
                return {
                    ...oldData,
                    profile: {
                        ...oldData.profile,
                        stats: {
                            ...oldData.profile.stats,
                            followers: oldData.profile.stats.followers + (res.isFollowing ? 1 : -1),
                        }
                    }

                }
            })
        },
        onError: (error: Error) => {
            console.error('Follow/Unfollow error:', error);
            notifyError(error.message || 'Có lỗi xảy ra khi thực hiện theo dõi/hủy theo dõi.');
        }
    });

    const changeAvatarMutation = useMutation({
        mutationFn: editAvatar,
        onSuccess: async (res: any) => {
            queryClient.setQueryData(['profile', userId], (oldData: ProfileData | undefined) => {
                if (!oldData) return oldData;
                return {
                    ...oldData,
                    user: {
                        ...oldData.user,
                        profile: {
                            ...oldData.user.profile,
                            avatar: {
                                publicId: res.avatar.publicId,
                                format: res.avatar.format,
                            }
                        }
                    }
                }
            })
            notifySuccess('Cập nhật ảnh đại diện thành công!');
            const newAvatar = { publicId: res.avatar.publicId, format: res.avatar.format };
            setAvatar(newAvatar);

            const newAvatarUrl = await getImage(newAvatar.publicId, newAvatar.format);
            if (newAvatarUrl) {
                setAvatarUrl(newAvatarUrl);
            }
        },
        onError: (error: Error) => {
            notifyError(error.message || 'Lỗi khi cập nhật ảnh đại diện!');
        }
    });

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && currentUser) {
            changeAvatarMutation.mutate({ userId: currentUser._id, file });
        }
    };

    useEffect(() => {
        setIsFollowing(profileData?.isFollowed || false);

        const handleAvatar = async () => {
            let avatarData = null;

            if (isOwnProfile && avatar) {
                avatarData = avatar;
            }
            else if (profileData?.user.profile?.avatar) {
                avatarData = profileData.user.profile.avatar;
                if (isOwnProfile) {
                    setAvatar(avatarData);
                }
            }

            if (avatarData?.publicId && avatarData?.format) {
                try {
                    const url = await getImage(avatarData.publicId, avatarData.format);
                    setAvatarUrl(url || defaultFallback);
                } catch (error) {
                    console.error('Error loading avatar:', error);
                    setAvatarUrl(defaultFallback);
                }
            } else {
                setAvatarUrl(defaultFallback);
            }
        };

        handleAvatar();
    }, [profileData?.isFollowed, profileData?.user.profile?.avatar, avatar, setAvatar]);

    useEffect(() => {
        const coverImageData = profileData?.profile.coverImage;
        if (coverImageData?.publicId && coverImageData?.format) {
            getImage(coverImageData.publicId, coverImageData.format)
                .then((url) => {
                    if (url) {
                        setCoverImage(url);
                    } else {
                        setCoverImage(defaultFallback);
                    }
                })
                .catch(() => setCoverImage(defaultFallback));
        } else {
            setCoverImage(defaultFallback);
        }
    }, [profileData?.profile.coverImage])

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

    const handleFollowToggle = () => {
        followMutation.mutate({ userId: currentUser?._id || '', followingUserId: profileData?.user._id || '' });
    };

    const handleOpenEditProfile = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsOpenEditProfile(true);
    }

    const isOwnProfile = currentUser?._id === profileData?.user._id;

    // Section Navigation
    const sections = [
        { id: 'overview', label: 'Tổng quan', icon: User },
        { id: 'novels', label: 'Truyện đã đăng', icon: Book, count: profileData?.novels.length },
        { id: 'likes', label: 'Yêu thích', icon: Heart, count: profileData?.likes.length },
    ];

    const getRoleStyle = (role: string) => {
        switch (role) {
            case "writer":
                return "bg-green-900/40 border-green-500 text-green-300";
            case "admin":
                return "bg-red-900/40 border-red-500 text-red-300";
            default:
                return "bg-blue-900/40 border-blue-500 text-blue-300";
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
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
            <LoadingComponent />
        );
    }

    // Error state
    if (profileError) {
        return (
            <div className="min-h-screen bg-gray-950">
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

    const { user, profile, novels, likes } = profileData;

    return (
        <div className="min-h-screen bg-gray-950">
            {/* Cover Section */}
            <div className="border flex flex-col mt-4 mx-4 border-gray-800 rounded-sm">
                {/* Cover Photo */}
                <div className="relative group h-50 md:h-96 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 overflow-hidden">
                    {coverImage && coverImage !== defaultFallback && (
                        <CustomImage
                            objectCenter={true}
                            src={coverImage}
                            alt="Cover Image"
                            width={2000}
                            height={1000}
                        />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                </div>

                {/* Profile Header */}
                <div className="max-w-full md:px-6">
                    <div className="flex flex-col md:flex md:flex-row justify-between gap-6">
                        {/* Avatar */}
                        <div className='flex flex-col md:flex-row md:mb-2.5 gap-3 md:gap-6 items-center'>
                            <div className="relative -mt-16">
                                <div className={`w-35 h-35 rounded-full overflow-hidden border-2 border-gray-700 shadow-2xl bg-gray-800 ${isOwnProfile ? 'ml-1' : 'ml-0'}`}>
                                    <CustomImage
                                        src={avatarUrl || defaultFallback}
                                        alt="Avatar"
                                        width={160}
                                        height={160}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                {isOwnProfile && (
                                    <button className="absolute bottom-0 right-0 w-12 h-12 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center border-3 border-white shadow-lg transition-colors group"
                                        onClick={handleClick}
                                    >
                                        {changeAvatarMutation.isPending ?
                                            (
                                                <Loader className="w-5 h-5 text-white animate-spin" />

                                            ) : (
                                                <Camera className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                                            )
                                        }
                                    </button>
                                )}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                            </div>
                            <div className="flex flex-col items-center justify-center md:mt-1 md:items-start">
                                <div>
                                    <h1 className="text-4xl font-bold text-white">{user.username}</h1>
                                </div>
                                <div className={`flex items-center gap-2 px-3 py-0.5 mt-1 border rounded-full ${getRoleStyle(user.role)}`} >
                                    {getRoleIcon(user.role)}
                                    <span className="font-medium">
                                        {handleRole(profileData.user.role)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className='block md:hidden border-t border-gray-500 mx-5'></div>
                        <div className="flex flex-col md:flex-row mb-6 md:mb-0 gap-3 items-center justify-center w-full md:w-auto">
                            {isOwnProfile ? (
                                <>
                                    <button className="w-50 px-4 py-2 md:px-6 md:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-500/25"
                                        onClick={(e) => handleOpenEditProfile(e)}
                                    >
                                        <Edit3 className="w-5 h-5" />
                                        <span>Chỉnh sửa profile</span>
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={handleFollowToggle}
                                        disabled={followMutation.isPending || changeAvatarMutation.isPending}
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

            {/* Stats Dashboard */}
            <div className="max-w-full mx-4 mt-4 mb-8 border border-gray-800 rounded-sm">
                <div className="backdrop-blur-sm rounded-xl p-2 md:p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {/* Truyện đã đăng */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="relative group"
                        >
                            <div className="bg-gradient-to-br from-blue-500/20 to-blue-700/20 backdrop-blur-sm rounded-2xl border border-blue-400/30 p-6 hover:border-blue-400/50 transition-all duration-300">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                                        <Book className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-white">{formatNumber(profile.stats.totalNovels)}</div>
                                        <div className="text-xs text-blue-300">Truyện</div>
                                    </div>
                                </div>
                                <div className="text-sm text-blue-200/80">Đã đăng</div>
                                {/* Progress bar effect */}
                                <div className="mt-3 h-1 bg-blue-900/30 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-blue-400 to-blue-600"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(profile.stats.totalNovels * 10, 100)}%` }}
                                        transition={{ delay: 0.5, duration: 1 }}
                                    />
                                </div>
                            </div>
                        </motion.div>

                        {/* Lượt xem */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="relative group"
                        >
                            <div className="bg-gradient-to-br from-purple-500/20 to-purple-700/20 backdrop-blur-sm rounded-2xl border border-purple-400/30 p-6 hover:border-purple-400/50 transition-all duration-300">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                                        <Eye className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-white">{formatNumber(profile.stats.totalViews)}</div>
                                        <div className="text-xs text-purple-300">Views</div>
                                    </div>
                                </div>
                                <div className="text-sm text-purple-200/80">Lượt xem</div>
                                <div className="mt-3 h-1 bg-purple-900/30 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-purple-400 to-purple-600"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(profile.stats.totalViews / 1000, 100)}%` }}
                                        transition={{ delay: 0.7, duration: 1 }}
                                    />
                                </div>
                            </div>
                        </motion.div>

                        {/* Người theo dõi */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="relative group"
                        >
                            <div className="bg-gradient-to-br from-green-500/20 to-green-700/20 backdrop-blur-sm rounded-2xl border border-green-400/30 p-6 hover:border-green-400/50 transition-all duration-300">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
                                        <Users className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-white">{formatNumber(profile.stats.followers)}</div>
                                        <div className="text-xs text-green-300">Followers</div>
                                    </div>
                                </div>
                                <div className="text-sm text-green-200/80">Theo dõi</div>
                                <div className="mt-3 h-1 bg-green-900/30 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-green-400 to-green-600"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(profile.stats.followers / 10, 100)}%` }}
                                        transition={{ delay: 0.9, duration: 1 }}
                                    />
                                </div>
                            </div>
                        </motion.div>

                        {/* Đang theo dõi */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="relative group"
                        >
                            <div className="bg-gradient-to-br from-pink-500/20 to-pink-700/20 backdrop-blur-sm rounded-2xl border border-pink-400/30 p-6 hover:border-pink-400/50 transition-all duration-300">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl shadow-lg">
                                        <Heart className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-white">{formatNumber(profile.stats.following)}</div>
                                        <div className="text-xs text-pink-300">Following</div>
                                    </div>
                                </div>
                                <div className="text-sm text-pink-200/80">Đang theo dõi</div>
                                <div className="mt-3 h-1 bg-pink-900/30 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-pink-400 to-pink-600"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(profile.stats.following / 5, 100)}%` }}
                                        transition={{ delay: 1.1, duration: 1 }}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-full mx-auto px-4">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar */}
                    <div className="lg:w-80 space-y-6">
                        {/* Navigation */}
                        <div className="bg-gray-950 backdrop-blur-sm rounded-sm border border-gray-700/50 p-6">
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
                        <div className="bg-gray-950 backdrop-blur-sm rounded-sm border border-gray-700/50 p-6">
                            <h3 className="text-white font-semibold mb-4">Thông tin cá nhân</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center gap-3">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-300">Tham gia {formatDate(user.createdAt)}</span>
                                </div>

                                {profile.birthday && (
                                    <div className="flex items-center gap-3">
                                        <CakeIcon className="w-4 h-4 text-gray-400" />
                                        <span className="text-gray-300">Sinh nhật {formatDate(profile.birthday)}</span>
                                    </div>
                                )}

                                {/* Occupation */}
                                {profile.occupation && (
                                    <div className="flex items-center gap-3">
                                        <User className="w-4 h-4 text-gray-400" />
                                        <span className="text-gray-300">{profile.occupation}</span>
                                    </div>
                                )}

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

                            {/* Favorites Section */}
                            {profile.favorites && (
                                <div className="border-t border-gray-700 mt-6 pt-6">
                                    <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                                        <Heart className="w-4 h-4 text-pink-400" />
                                        Sở thích
                                    </h4>
                                    <p className="text-gray-300 text-sm leading-relaxed">{profile.favorites}</p>
                                </div>
                            )}
                        </div>

                        {/* Achievements Section */}
                        {user.role === 'writer' && novels.length > 0 && (
                            <div className="bg-gray-950 backdrop-blur-sm rounded-sm border flex flex-col items-center border-gray-700/50 p-6">
                                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                                    <Trophy className="w-5 h-5 text-amber-400" />
                                    Thành tích nổi bậc
                                </h3>
                                <div className="space-y-3 w-full">
                                    {/* Most Popular Novel */}
                                    {(() => {
                                        const mostPopular = novels.reduce((prev, current) =>
                                            (prev.views > current.views) ? prev : current
                                        );
                                        return (
                                            <div className="bg-gray-700/30 rounded-lg p-3 flex flex-col items-center">
                                                <div className="flex items-center gap-2">
                                                    <TrendingUp className="w-4 h-4 text-green-400" />
                                                    <span className="text-sm font-medium text-green-400">Phổ biến nhất</span>
                                                </div>
                                                <p className="text-white text-lg font-medium truncate">{mostPopular.title}</p>
                                                <p className="text-gray-400 text-xs">{formatNumber(mostPopular.views)} lượt xem</p>
                                            </div>
                                        );
                                    })()}

                                    {/* Highest Rated Novel */}
                                    {(() => {
                                        const highestRated = novels.reduce((prev, current) =>
                                            (prev.rating > current.rating) ? prev : current
                                        );
                                        return (
                                            <div className="bg-gray-700/30 rounded-lg p-3 flex flex-col items-center">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Star className="w-4 h-4 text-yellow-400" />
                                                    <span className="text-sm font-medium text-yellow-400">Đánh giá cao nhất</span>
                                                </div>
                                                <p className="text-white text-sm font-medium truncate">{highestRated.title}</p>
                                                <p className="text-gray-400 text-xs">{highestRated.rating.toFixed(1)} ⭐</p>
                                            </div>
                                        );
                                    })()}

                                    {/* Total Engagement */}
                                    <div className="bg-gray-700/30 rounded-lg p-3 flex flex-col items-center">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Heart className="w-4 h-4 text-pink-400" />
                                            <span className="text-sm font-medium text-pink-400">Tổng tương tác</span>
                                        </div>
                                        <p className="text-white text-sm font-medium">
                                            {formatNumber(novels.reduce((sum, novel) => sum + novel.likes, 0))} lượt thích
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
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
                                    className="space-y-8 mb-10"
                                >
                                    {/* Overview Timeline */}
                                    <div className="bg-gray-950 backdrop-blur-sm rounded-sm border border-gray-600/50 py-4 px-4 md:p-6">
                                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                            <TrendingUp className="w-6 h-6 text-green-500" />
                                            Tổng quan hoạt động
                                        </h2>

                                        {/* Activity Timeline */}
                                        <div className="gap-4 mb-8 grid md:grid-cols-2">
                                            <div className="flex items-start gap-4 p-4 bg-gray-700/30 rounded-lg">
                                                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                                                <div>
                                                    <p className="text-white text-sm">
                                                        Tham gia từ <span className="font-semibold">{formatDate(user.createdAt)}</span>
                                                    </p>
                                                    <p className="text-gray-400 text-xs">
                                                        {Math.floor((new Date().getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))} ngày hoạt động
                                                    </p>
                                                </div>
                                            </div>

                                            {novels.length > 0 && (
                                                <div className="flex items-start gap-4 p-4 bg-gray-700/30 rounded-lg">
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                                    <div>
                                                        <p className="text-white text-sm">
                                                            Đã đăng <span className="font-semibold">{novels.length}</span> truyện
                                                        </p>
                                                        <p className="text-gray-400 text-xs">
                                                            Truyện mới nhất: {novels[0]?.title}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {profile.stats.totalViews > 0 && (
                                                <div className="flex items-start gap-4 p-4 bg-gray-700/30 rounded-lg">
                                                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                                                    <div>
                                                        <p className="text-white text-sm">
                                                            Đạt <span className="font-semibold">{formatNumber(profile.stats.totalViews)}</span> lượt xem
                                                        </p>
                                                        <p className="text-gray-400 text-xs">
                                                            Trung bình {Math.floor(profile.stats.totalViews / Math.max(novels.length, 1))} view/truyện
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {profile.stats.followers > 0 && (
                                                <div className="flex items-start gap-4 p-4 bg-gray-700/30 rounded-lg">
                                                    <div className="w-2 h-2 bg-pink-500 rounded-full mt-2"></div>
                                                    <div>
                                                        <p className="text-white text-sm">
                                                            Có <span className="font-semibold">{formatNumber(profile.stats.followers)}</span> người theo dõi
                                                        </p>
                                                        <p className="text-gray-400 text-xs">
                                                            Đang theo dõi {formatNumber(profile.stats.followers)} người
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-6">
                                            {/* Latest Novels */}
                                            {novels.length > 0 && (
                                                <div>
                                                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center justify-between">
                                                        <span className="flex items-center gap-2">
                                                            <Book className="w-5 h-5 text-blue-500" />
                                                            Truyện mới nhất
                                                        </span>
                                                        {novels.length > 4 && (
                                                            <button
                                                                onClick={() => setActiveSection('novels')}
                                                                className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                                                            >
                                                                Xem tất cả
                                                                <ChevronRight className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </h3>
                                                    <div className="grid gap-4 md:grid-cols-2">
                                                        {novels.slice(0, 4).map((novel, index) => (
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
                                                        {likes.length > 4 && (
                                                            <button
                                                                onClick={() => setActiveSection('likes')}
                                                                className="text-pink-400 hover:text-pink-300 text-sm flex items-center gap-1"
                                                            >
                                                                Xem tất cả
                                                                <ChevronRight className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </h3>
                                                    <div className="grid gap-4 md:grid-cols-2">
                                                        {likes.slice(0, 4).map((like, index) => (
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
                                    className="bg-gray-950 backdrop-blur-sm rounded-sm border border-gray-600/50 p-6"
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
                                    className="bg-gray-950/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6"
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
                        </AnimatePresence>
                    </div>
                </div>
                <div>
                    <UpdateProfilePopup
                        isOpen={isOpenEditProfile}
                        onClose={() => setIsOpenEditProfile(false)}
                        userId={user._id}
                        currentProfile={profile}
                    />
                </div>
            </div>
        </div >
    );
};

export default ProfilePage;