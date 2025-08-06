import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { UserIcon, EnvelopeIcon, LockClosedIcon, EyeIcon, EyeSlashIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import './AuthForm.css';
import { FaGoogle, FaGithub } from "react-icons/fa";
import ButtonClick from '../ui/ButtonClick';
import { Popup } from '../ui/Popup';

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
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword ] = useState(false);

    let startX = 0;
    let startY = 0;

    const mutation = useMutation({
        mutationFn: async () => {
            const endpoint = tab === 'login' ? '/api/auth/login' : '/api/auth/register';
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    email,
                    username: tab === 'login' ? undefined : username,
                    password,
                }),
                credentials: 'include',
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Có lỗi xảy ra.');
            }
            return data;
        },
        onSuccess: (data) => {
            if (data.success) {
                setEmail('');
                setUsername('');
                setPassword('');
                setConfirmPassword('');
                setSuccessMsg(tab === 'login' ? 'Đăng nhập thành công!' : 'Đăng ký thành công!');
                setErrorMsg('');
                setTimeout(() => {
                    onClose()
                    window.location.reload(); 
                }, 200);
            } else {
                setErrorMsg(data.error || '');
            }
        },
        onError: (error: any) => {
            setErrorMsg(error.message || 'Có lỗi xảy ra, vui lòng thử lại!');
        }
    });

    useEffect(() => {
    if (errorMsg) {
        const timeout = setTimeout(() => setErrorMsg(''), 3000); 
        return () => clearTimeout(timeout);
    }
    }, [errorMsg]);

    useEffect(() => {
    if (successMsg) {
        const timeout = setTimeout(() => setSuccessMsg(''), 3000);
        return () => clearTimeout(timeout);
    }
    }, [successMsg]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        if (tab === 'register' && password !== confirmPassword) {
            setErrorMsg('Mật khẩu không khớp.');
            return;
        }
        if (!email.includes('@') || password.length < 6) {
            setErrorMsg('Email hoặc mật khẩu không hợp lệ.');
            return;
        }
        mutation.mutate();
    }

    const resetForm = () => {
        setEmail('');
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        setErrorMsg('');
        setShowPassword(false);
        setShowConfirmPassword(false);
    };

    return (
    <> <link href="https://fonts.googleapis.com/css2?family=Crimson+Text&display=swap" rel="stylesheet" />
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="auth-overlay" 
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
                    }}}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        className="auth-modal md:scale-100 scale-90"
                        onMouseDown={(e) => e.stopPropagation()}
                        onMouseUp={(e) => e.stopPropagation()}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    >
                        <button className="close-btn" onClick={onClose}>
                            ✕
                        </button>
                    <div className='auth-content-container'>
                        {/* Đầu đề */}
                        <div className='auth-header'>
                            <div>
                                <BookOpenIcon className='w-15 h-15' />
                            </div>
                            <div className='auth-header-title'> 
                            <h1>Chào mừng đến NovelSphere</h1>
                            <p>Cùng nhau chia sẽ niềm đam mê cháy bỏng</p>
                            </div>
                        </div>

                        {/* Tab chuyển đổi */}
                        <div className='auth-tabs'>
                            <button className={tab === 'login' ? 'active' : ''} onClick={() => { setTab('login'); resetForm(); }}>
                                Đăng nhập
                            </button>
                            <button className={tab === 'register' ? 'active' : ''} onClick={() => { setTab('register'); resetForm();}}>
                                Đăng ký
                            </button>
                        </div>
                        {/* Form */}
                        <form className='auth-form' onSubmit={handleSubmit}>
                            {tab === 'register' && (
                                <div><p className='input-note'>Username</p>
                                <div className='input-group'>
                                    <UserIcon className='w-5 h-5'/>
                                    <input type='text' placeholder='Tên đăng nhập...' value={username} onChange={(e) => setUsername(e.target.value)} required/>
                                </div>
                                </div>
                            )}
                            <div><p className='input-note'>Email</p>
                                <div className='input-group'>
                                    <EnvelopeIcon className='w-5 h-5' />
                                    <input type='email' placeholder='Email...' value={email} onChange={(e) => setEmail(e.target.value)} required/>
                                </div>
                            </div>
                            <div><p className='input-note'>Password</p>
                                <div className='input-group'>
                                    <LockClosedIcon className='w-5 h-5'/>
                                    <input type={showPassword ? 'text' : 'password'} placeholder='Mật khẩu...' value={password} onChange={(e) => {setPassword(e.target.value)}} required/>
                                    {showPassword == false && password !== '' && (
                                        <EyeIcon className='w-5 h-5 cursor-pointer' onClick={() => setShowPassword(true)}/>
                                    )}
                                    {showPassword == true && password !== '' &&
                                        <EyeSlashIcon className='w-5 h-5 cursor-pointer' onClick={() => setShowPassword(false)}/>
                                    }
                            </div>
                            </div>
                            {tab === 'register' && 
                            <div><p className='input-note'>Confirm Password</p>
                                <div className='input-group'>
                                    <LockClosedIcon className='w-5 h-5'/>
                                    <input type={showConfirmPassword ? 'text' : 'password'} placeholder='Xác nhận mật khẩu...' value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required/>
                                    {showConfirmPassword == false && confirmPassword !== '' && 
                                        <EyeIcon className='w-5 h-5 cursor-pointer' onClick={() => setShowConfirmPassword(true)}/>
                                    }
                                    {showConfirmPassword == true && confirmPassword !== '' && 
                                        <EyeSlashIcon className='w-5 h-5 cursor-pointer' onClick={() => setShowConfirmPassword(false)}/>
                                    }
                                </div>
                            </div>
                            }

                            {tab === 'login' && (
                                <div className="form-footer">
                                <label>
                                    <input type="checkbox" /> Ghi nhớ đăng nhập
                                </label>
                                <a href="#">Quên mật khẩu?</a>
                                </div>
                            )}
                            {tab === 'register' && (
                                <div className="form-footer-term">
                                    <a href='#'>Tôi đồng ý với các điều khoản dịch vụ</a>
                                </div>
                            )}
                            <div className='flex justify-center margin-top-4 margin-bottom-4'>
                                <button type="submit" className="submit-btn" disabled={mutation.isPending}>
                                    {mutation.isPending ? 'Đang xử lý...' : tab === 'login' ? 'Đăng nhập...' : 'Đăng ký...'}
                                </button>
                            </div>
                            </form>
                        <div className="auth-divider">
                            HOẶC {tab === 'login' ? 'ĐĂNG NHẬP BẰNG' : 'ĐĂNG KÝ BẰNG'}
                            <div className='link-button-container'>
                                <ButtonClick 
                                    type={<FaGoogle className='w-5 h-5'/>} 
                                    text='GOOGLE' 
                                    href='#'
                                />
                                    <ButtonClick 
                                    type={<FaGithub className='w-5 h-5'/>} 
                                    text='GITHUB' 
                                    href='#'
                                />
                            </div>
                        </div>
                    </div>    
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
        <AnimatePresence>
            {errorMsg && (
                <Popup
                    message={errorMsg}
                    onClose={() => setErrorMsg('')}
                    type="error"
                />
            )}
            {successMsg && (
                <Popup
                    message={successMsg}
                    onClose={() => setSuccessMsg('')}
                    type="success"
                />
            )}
        </AnimatePresence>
    </>
    );    
}