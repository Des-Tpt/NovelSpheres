import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { UserIcon, EnvelopeIcon, LockClosedIcon, EyeIcon, EyeSlashIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import { FaGoogle, FaGithub } from "react-icons/fa";
import ButtonClick from '../ui/ButtonClick';
import { notifyError, notifySuccess } from '@/utils/notify';

interface Props {
    onClose: () => void;
    isOpen: boolean;
}

export default function AuthForm({ onClose, isOpen }: Props) {
    const [tab, setTab] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    let startX = 0;
    let startY = 0;

    const mutation = useMutation({
        mutationFn: async () => {
            const endpoint = tab === 'login' ? '/api/auth/login' : '/api/auth/register';
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    username: tab === 'login' ? undefined : username,
                    password,
                }),
                credentials: 'include',
            });

            const data = await res.json();
            if (!res.ok) {
                throw Error(data.error || 'Có lỗi xảy ra.');
            }
            return data;
        },
        onSuccess: (data) => {
            if (data.success) {
                // Reset form
                setEmail('');
                setUsername('');
                setPassword('');
                setConfirmPassword('');

                // Hiện toast success
                notifySuccess(tab === 'login' ? 'Đăng nhập thành công!' : 'Đăng ký thành công!');

                // Đóng modal sau 2 giây để user kịp thấy toast
                setTimeout(() => {
                    onClose();
                }, 500);

                // Reload page sau 3 giây để fetch lại data
                setTimeout(() => {
                    window.location.reload();
                }, 500);

            } else {
                notifyError(data.error || '');
            }
        },
        onError: (error: any) => {
            notifyError(error.message || 'Có lỗi xảy ra, vui lòng thử lại!');
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (tab === 'register' && password !== confirmPassword) {
            notifyError('Mật khẩu không khớp.');
            return;
        }
        if (!email.includes('@') || password.length < 6) {
            notifyError('Email hoặc mật khẩu không hợp lệ.');
            return;
        }
        mutation.mutate();
    }

    const resetForm = () => {
        setEmail('');
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        setShowPassword(false);
        setShowConfirmPassword(false);
    };

    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Crimson+Text&display=swap" rel="stylesheet" />
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="fixed inset-0 bg-black/70 z-50
                                   md:flex md:justify-center items-center md:p-4
                                   flex justify-center md:items-center"
                        onMouseDown={(e) => {
                            startX = e.clientX;
                            startY = e.clientY;
                        }}
                        onMouseUp={(e) => {
                            const dx = e.clientX - startX;
                            const dy = e.clientY - startY;
                            const distance = Math.sqrt(dx * dx + dy * dy);
                            if (distance < 10) {
                                onClose();
                            }
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            // Desktop: popup modal với max-width và border radius
                            // Mobile: full screen overlay
                            className="bg-black text-white relative
                                       w-full h-full overflow-y-auto
                                       md:w-full md:max-w-md md:h-auto md:max-h-[90vh] md:rounded-xl"
                            style={{ fontFamily: '"Crimson Text", Georgia, serif' }}
                            onMouseDown={(e) => e.stopPropagation()}
                            onMouseUp={(e) => e.stopPropagation()}
                            initial={{
                                // Mobile: slide up from bottom
                                // Desktop: scale from center
                                scale: typeof window !== 'undefined' && window.innerWidth >= 768 ? 0.8 : 1,
                                opacity: 0,
                                y: typeof window !== 'undefined' && window.innerWidth < 768 ? '100%' : 0
                            }}
                            animate={{
                                scale: 1,
                                opacity: 1,
                                y: 0
                            }}
                            exit={{
                                scale: typeof window !== 'undefined' && window.innerWidth >= 768 ? 0.8 : 1,
                                opacity: 0,
                                y: typeof window !== 'undefined' && window.innerWidth < 768 ? '100%' : 0
                            }}
                            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                        >
                            {/* Close Button */}
                            <button
                                className="absolute top-3 right-3 text-white text-xl hover:text-gray-300 transition-colors z-10
                                           md:top-4 md:right-4"
                                onClick={onClose}
                            >
                                ✕
                            </button>

                            <div className="p-6 sm:p-8 min-h-full md:min-h-0">
                                {/* Header */}
                                <div className="flex items-center mb-6 mt-4 md:mt-0">
                                    <BookOpenIcon className="w-12 h-12 sm:w-15 sm:h-15 flex-shrink-0" />
                                    <div className="ml-4 sm:ml-6">
                                        <h1 className="text-xl sm:text-2xl font-bold mb-1">
                                            Chào mừng đến NovelSphere
                                        </h1>
                                        <p className="text-sm sm:text-base text-gray-300">
                                            Cùng nhau chia sẻ niềm đam mê cháy bỏng
                                        </p>
                                    </div>
                                </div>

                                {/* Tabs */}
                                <div className="flex justify-center mb-6">
                                    <div className="flex bg-gray-800 rounded-lg p-1">
                                        <button
                                            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${tab === 'login'
                                                ? 'bg-white text-black'
                                                : 'text-white hover:text-gray-300'
                                                }`}
                                            onClick={() => { setTab('login'); resetForm(); }}
                                        >
                                            Đăng nhập
                                        </button>
                                        <button
                                            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${tab === 'register'
                                                ? 'bg-white text-black'
                                                : 'text-white hover:text-gray-300'
                                                }`}
                                            onClick={() => { setTab('register'); resetForm(); }}
                                        >
                                            Đăng ký
                                        </button>
                                    </div>
                                </div>

                                {/* Form */}
                                <form className="space-y-4" onSubmit={handleSubmit}>
                                    {tab === 'register' && (
                                        <div>
                                            <label className="block text-sm font-bold text-white mb-2 ml-2">
                                                Username
                                            </label>
                                            <div className="flex items-center bg-gray-900 rounded-lg px-4 py-3 gap-3">
                                                <UserIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                                <input
                                                    type="text"
                                                    placeholder="Tên đăng nhập..."
                                                    value={username}
                                                    onChange={(e) => setUsername(e.target.value)}
                                                    required
                                                    className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-400"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-bold text-white mb-2 ml-2">
                                            Email
                                        </label>
                                        <div className="flex items-center bg-gray-900 rounded-lg px-4 py-3 gap-3">
                                            <EnvelopeIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                            <input
                                                type="email"
                                                placeholder="Email..."
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                                className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-400"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-white mb-2 ml-2">
                                            Password
                                        </label>
                                        <div className="flex items-center bg-gray-900 rounded-lg px-4 py-3 gap-3">
                                            <LockClosedIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder="Mật khẩu..."
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-400"
                                            />
                                            {password !== '' && (
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="text-gray-400 hover:text-white transition-colors"
                                                >
                                                    {showPassword ?
                                                        <EyeSlashIcon className="w-5 h-5" /> :
                                                        <EyeIcon className="w-5 h-5" />
                                                    }
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {tab === 'register' && (
                                        <div>
                                            <label className="block text-sm font-bold text-white mb-2 ml-2">
                                                Confirm Password
                                            </label>
                                            <div className="flex items-center bg-gray-900 rounded-lg px-4 py-3 gap-3">
                                                <LockClosedIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                                <input
                                                    type={showConfirmPassword ? 'text' : 'password'}
                                                    placeholder="Xác nhận mật khẩu..."
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    required
                                                    className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-400"
                                                />
                                                {confirmPassword !== '' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                        className="text-gray-400 hover:text-white transition-colors"
                                                    >
                                                        {showConfirmPassword ?
                                                            <EyeSlashIcon className="w-5 h-5" /> :
                                                            <EyeIcon className="w-5 h-5" />
                                                        }
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Form Footer Options */}
                                    {tab === 'login' && (
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mt-6">
                                            <label className="flex items-center text-sm">
                                                <input
                                                    type="checkbox"
                                                    className="mr-2 rounded"
                                                />
                                                Ghi nhớ đăng nhập
                                            </label>
                                            <a href="#" className="text-sm font-bold hover:text-gray-300 transition-colors">
                                                Quên mật khẩu?
                                            </a>
                                        </div>
                                    )}

                                    {tab === 'register' && (
                                        <div className="mt-6">
                                            <a href="#" className="block text-center text-sm hover:text-gray-300 transition-colors">
                                                Tôi đồng ý với các điều khoản dịch vụ
                                            </a>
                                        </div>
                                    )}

                                    {/* Submit Button */}
                                    <div className="mt-6">
                                        <button
                                            type="submit"
                                            disabled={mutation.isPending}
                                            className="w-full bg-amber-800 hover:bg-amber-700 disabled:bg-amber-900 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors text-lg"
                                            style={{ fontFamily: '"Crimson Text", Georgia, serif' }}
                                        >
                                            {mutation.isPending
                                                ? 'Đang xử lý...'
                                                : tab === 'login'
                                                    ? 'Đăng nhập'
                                                    : 'Đăng ký'
                                            }
                                        </button>
                                    </div>
                                </form>

                                {/* Divider & Social Login */}
                                <div className="mt-8 pb-6 md:pb-0">
                                    <div className="text-center text-gray-400 text-sm mb-4">
                                        HOẶC {tab === 'login' ? 'ĐĂNG NHẬP BẰNG' : 'ĐĂNG KÝ BẰNG'}
                                    </div>
                                    <div className="flex justify-between px-12 gap-3 sm:gap-4">
                                        <ButtonClick
                                            type={<FaGoogle className="w-4 h-4" />}
                                            text="GOOGLE"
                                            href="#"
                                        />
                                        <ButtonClick
                                            type={<FaGithub className="w-4 h-4" />}
                                            text="GITHUB"
                                            href="#"
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}