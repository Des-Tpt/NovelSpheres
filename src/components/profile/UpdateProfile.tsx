import React, { useState, useEffect } from 'react';
import { X, Upload, Loader2, User, Calendar, Briefcase, Heart } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateProfile } from '@/action/profileAction';
import { notifyError, notifySuccess } from '@/utils/notify';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '@/store/avatarUserStore';

interface UpdateProfilePopupProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    currentProfile?: {
        bio?: string;
        birthday?: string;
        favorites?: string;
        occupation?: string;
        socials?: {
            facebook?: string;
            twitter?: string;
            discord?: string;
            website?: string;
        };
        coverImage?: {
            publicId: string;
            format: string;
        };
    };
}

const UpdateProfilePopup: React.FC<UpdateProfilePopupProps> = ({
    isOpen,
    onClose,
    userId,
    currentProfile
}) => {
    const [bio, setBio] = useState<string>('');
    const [birthday, setBirthday] = useState<string>('');
    const [favorites, setFavorites] = useState<string>('');
    const [occupation, setOccupation] = useState<string>('');
    const [facebook, setFacebook] = useState<string>('');
    const [twitter, setTwitter] = useState<string>('');
    const [discord, setDiscord] = useState<string>('');
    const [website, setWebsite] = useState<string>('');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string>('');
    const [coverPreview, setCoverPreview] = useState<string>('');
    const setAvatar = useUserStore((state) => state.setAvatar);

    const queryClient = useQueryClient();

    // Initialize form with current profile data
    useEffect(() => {
        if (currentProfile && isOpen) {
            setBio(currentProfile.bio || '');
            setBirthday(currentProfile.birthday ? new Date(currentProfile.birthday).toISOString().split('T')[0] : '');
            setFavorites(currentProfile.favorites || '');
            setOccupation(currentProfile.occupation || '');
            setFacebook(currentProfile.socials?.facebook || '');
            setTwitter(currentProfile.socials?.twitter || '');
            setDiscord(currentProfile.socials?.discord || '');
            setWebsite(currentProfile.socials?.website || '');
        }
    }, [currentProfile, isOpen]);

    // Lock body scroll when popup is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            document.body.style.paddingRight = '0px';
        } else {
            document.body.style.overflow = 'unset';
            document.body.style.paddingRight = '0px';
        }

        return () => {
            document.body.style.overflow = 'unset';
            document.body.style.paddingRight = '0px';
        };
    }, [isOpen]);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setAvatarFile(file);

        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setAvatarPreview(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setAvatarPreview('');
        }
    };

    const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setCoverImageFile(file);

        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setCoverPreview(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setCoverPreview('');
        }
    };

    // Separate reset function
    const resetForm = () => {
        setBio('');
        setBirthday('');
        setFavorites('');
        setOccupation('');
        setFacebook('');
        setTwitter('');
        setDiscord('');
        setWebsite('');
        setAvatarFile(null);
        setCoverImageFile(null);
        setAvatarPreview('');
        setCoverPreview('');
    };

    const updateProfileMutation = useMutation({
        mutationFn: updateProfile,
        onSuccess: (res) => {
            console.log('Profile updated successfully:', res);
            if (res.avatar) {
                setAvatar({ publicId: res.avatar.publicId, format: res.avatar.format });
            }
            queryClient.invalidateQueries({ queryKey: ['profile', userId] });
            queryClient.invalidateQueries({ queryKey: ['user', userId] });
            notifySuccess('Cập nhật trang cá nhân thành công!');
            resetForm();
            setTimeout(() => {
                onClose();
            }, 100);
        },
        onError: (error: Error) => {
            notifyError(error.message || 'Đã xảy ra lỗi khi cập nhật profile');
        }
    });

    const handleSubmit = async () => {
        const updateData = {
            bio: bio.trim(),
            birthday: birthday || undefined,
            favorites: favorites.trim(),
            occupation: occupation.trim(),
            avatar: avatarFile || undefined,
            coverImage: coverImageFile || undefined,
            socials: {
                facebook: facebook.trim(),
                twitter: twitter.trim(),
                discord: discord.trim(),
                website: website.trim()
            }
        };

        // Remove empty socials
        Object.keys(updateData.socials).forEach(key => {
            const typedKey = key as keyof typeof updateData.socials;
            if (!updateData.socials[typedKey]) {
                delete updateData.socials[typedKey];
            }
        });

        try {
            await updateProfileMutation.mutateAsync({ userId, data: updateData });
        } catch (error) {
            notifyError('Lỗi khi cập nhật profile!');
        }
    };

    const handleClose = () => {
        if (!updateProfileMutation.isPending) {
            resetForm();
            onClose();
        }
    };

    // Handle backdrop click
    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget && !updateProfileMutation.isPending) {
            handleClose();
        }
    };

    // Handle ESC key
    useEffect(() => {
        const handleEscKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !updateProfileMutation.isPending) {
                handleClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscKey);
            return () => {
                document.removeEventListener('keydown', handleEscKey);
            };
        }
    }, [isOpen, updateProfileMutation.isPending]);

    if (!isOpen) {
        return null;
    }

    return (
        <>
            {isOpen && (
                <AnimatePresence>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4"
                        onClick={handleBackdropClick}
                        style={{
                            backdropFilter: 'blur(2px)',
                            WebkitBackdropFilter: 'blur(2px)'
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 25,
                                duration: 0.3
                            }}
                            className="bg-gray-900 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700 relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Loading Overlay */}
                            <AnimatePresence>
                                {updateProfileMutation.isPending && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 bg-gray-900/80 rounded-lg flex items-center justify-center z-10"
                                    >
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                                            <p className="text-sm text-gray-300">Đang cập nhật profile...</p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                                    <User size={20} />
                                    Cập nhật thông tin cá nhân
                                </h2>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={handleClose}
                                    className="hover:text-yellow-300 transition-colors cursor-pointer text-gray-400 disabled:opacity-50"
                                    disabled={updateProfileMutation.isPending}
                                    type="button"
                                >
                                    <X size={20} />
                                </motion.button>
                            </div>

                            <div className="space-y-6">
                                {/* Avatar Upload */}
                                <motion.div
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    <label className="block text-sm font-medium mb-2 text-gray-300">
                                        Ảnh đại diện
                                    </label>
                                    <div className="flex items-center gap-4">
                                        {avatarPreview && (
                                            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-blue-500">
                                                <img
                                                    src={avatarPreview}
                                                    alt="Avatar preview"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <input
                                                type="file"
                                                onChange={handleAvatarChange}
                                                className="hidden"
                                                id="avatar-upload"
                                                accept=".jpg,.png,.jpeg"
                                                disabled={updateProfileMutation.isPending}
                                            />
                                            <motion.label
                                                whileHover={{ scale: updateProfileMutation.isPending ? 1 : 1.02 }}
                                                whileTap={{ scale: updateProfileMutation.isPending ? 1 : 0.98 }}
                                                htmlFor="avatar-upload"
                                                className={`px-3 py-2 bg-black border border-gray-600 rounded text-white cursor-pointer hover:border-blue-400 transition-colors flex items-center gap-2 ${updateProfileMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''
                                                    }`}
                                            >
                                                <Upload size={16} />
                                                {avatarFile ? avatarFile.name : 'Chọn ảnh đại diện...'}
                                            </motion.label>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Cover Image Upload */}
                                <motion.div
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.15 }}
                                >
                                    <label className="block text-sm font-medium mb-2 text-gray-300">
                                        Ảnh bìa
                                    </label>
                                    <div className="space-y-3">
                                        {coverPreview && (
                                            <div className="w-full h-32 rounded overflow-hidden border-2 border-blue-500">
                                                <img
                                                    src={coverPreview}
                                                    alt="Cover preview"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            onChange={handleCoverImageChange}
                                            className="hidden"
                                            id="cover-upload"
                                            accept=".jpg,.png,.jpeg"
                                            disabled={updateProfileMutation.isPending}
                                        />
                                        <motion.label
                                            whileHover={{ scale: updateProfileMutation.isPending ? 1 : 1.02 }}
                                            whileTap={{ scale: updateProfileMutation.isPending ? 1 : 0.98 }}
                                            htmlFor="cover-upload"
                                            className={`w-full px-3 py-2 bg-black border border-gray-600 rounded text-white cursor-pointer hover:border-blue-400 transition-colors flex items-center gap-2 ${updateProfileMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''
                                                }`}
                                        >
                                            <Upload size={16} />
                                            {coverImageFile ? coverImageFile.name : 'Chọn ảnh bìa...'}
                                        </motion.label>
                                    </div>
                                </motion.div>

                                {/* Bio */}
                                <motion.div
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <label className="text-sm font-medium mb-2 text-gray-300 flex items-center gap-2">
                                        <User size={16} />
                                        Giới thiệu bản thân
                                    </label>
                                    <textarea
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        placeholder="Viết vài dòng về bản thân..."
                                        rows={4}
                                        maxLength={1000}
                                        className="w-full px-3 py-2 bg-black border-2 border-blue-500 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors disabled:opacity-50 resize-none"
                                        disabled={updateProfileMutation.isPending}
                                    />
                                    <p className="text-xs text-gray-400 mt-1">{bio.length}/1000 ký tự</p>
                                </motion.div>

                                {/* Personal Info Row */}
                                <motion.div
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.25 }}
                                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                                >
                                    {/* Birthday */}
                                    <div>
                                        <label className="text-sm font-medium mb-2 text-gray-300 flex items-center gap-2">
                                            <Calendar size={16} />
                                            Ngày sinh
                                        </label>
                                        <input
                                            type="date"
                                            value={birthday}
                                            onChange={(e) => setBirthday(e.target.value)}
                                            className="w-full px-3 py-2 bg-black border-2 border-blue-500 rounded text-white focus:outline-none focus:border-blue-400 transition-colors disabled:opacity-50"
                                            disabled={updateProfileMutation.isPending}
                                        />
                                    </div>

                                    {/* Occupation */}
                                    <div>
                                        <label className="text-sm font-medium mb-2 text-gray-300 flex items-center gap-2">
                                            <Briefcase size={16} />
                                            Nghề nghiệp
                                        </label>
                                        <input
                                            type="text"
                                            value={occupation}
                                            onChange={(e) => setOccupation(e.target.value)}
                                            placeholder="Ví dụ: Sinh viên, Developer..."
                                            className="w-full px-3 py-2 bg-black border-2 border-blue-500 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors disabled:opacity-50"
                                            disabled={updateProfileMutation.isPending}
                                        />
                                    </div>
                                </motion.div>

                                {/* Favorites */}
                                <motion.div
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <label className="text-sm font-medium mb-2 text-gray-300 flex items-center gap-2">
                                        <Heart size={16} />
                                        Sở thích
                                    </label>
                                    <input
                                        type="text"
                                        value={favorites}
                                        onChange={(e) => setFavorites(e.target.value)}
                                        placeholder="Ví dụ: Đọc sách, xem phim, chơi game..."
                                        className="w-full px-3 py-2 bg-black border-2 border-blue-500 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors disabled:opacity-50"
                                        disabled={updateProfileMutation.isPending}
                                    />
                                </motion.div>

                                {/* Social Links */}
                                <motion.div
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.35 }}
                                >
                                    <label className="block text-sm font-medium mb-3 text-gray-300">
                                        Liên kết mạng xã hội
                                    </label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <input
                                            type="url"
                                            value={facebook}
                                            onChange={(e) => setFacebook(e.target.value)}
                                            placeholder="Facebook URL"
                                            className="px-3 py-2 bg-black border-2 border-blue-500 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors disabled:opacity-50"
                                            disabled={updateProfileMutation.isPending}
                                        />
                                        <input
                                            type="text"
                                            value={twitter}
                                            onChange={(e) => setTwitter(e.target.value)}
                                            placeholder="Twitter/X handle"
                                            className="px-3 py-2 bg-black border-2 border-blue-500 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors disabled:opacity-50"
                                            disabled={updateProfileMutation.isPending}
                                        />
                                        <input
                                            type="text"
                                            value={discord}
                                            onChange={(e) => setDiscord(e.target.value)}
                                            placeholder="Discord username"
                                            className="px-3 py-2 bg-black border-2 border-blue-500 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors disabled:opacity-50"
                                            disabled={updateProfileMutation.isPending}
                                        />
                                        <input
                                            type="url"
                                            value={website}
                                            onChange={(e) => setWebsite(e.target.value)}
                                            placeholder="Website URL"
                                            className="px-3 py-2 bg-black border-2 border-blue-500 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors disabled:opacity-50"
                                            disabled={updateProfileMutation.isPending}
                                        />
                                    </div>
                                </motion.div>

                                {/* Buttons */}
                                <motion.div
                                    className="flex gap-3 pt-4"
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    <motion.button
                                        whileHover={{ scale: updateProfileMutation.isPending ? 1 : 1.02 }}
                                        whileTap={{ scale: updateProfileMutation.isPending ? 1 : 0.98 }}
                                        onClick={handleClose}
                                        className="flex-1 px-4 py-2 cursor-pointer border border-gray-600 text-white rounded hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={updateProfileMutation.isPending}
                                        type="button"
                                    >
                                        Hủy
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: updateProfileMutation.isPending ? 1 : 1.02 }}
                                        whileTap={{ scale: updateProfileMutation.isPending ? 1 : 0.98 }}
                                        onClick={handleSubmit}
                                        className="flex-1 px-4 py-2 cursor-pointer bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        disabled={updateProfileMutation.isPending}
                                        type="button"
                                    >
                                        {updateProfileMutation.isPending ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Đang cập nhật...
                                            </>
                                        ) : (
                                            'Cập nhật Profile'
                                        )}
                                    </motion.button>
                                </motion.div>
                            </div>
                        </motion.div>
                    </motion.div>
                </AnimatePresence>
            )}
        </>
    );
};

export default UpdateProfilePopup;