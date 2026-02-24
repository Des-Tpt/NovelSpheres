import React from 'react';
import Link from 'next/link';
import { Facebook, Twitter, Instagram, Disc as Discord, Mail, BookOpen } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-gray-950 border-t border-gray-800 text-gray-400 pt-16 pb-8 font-inter">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                    {/* Brand Section */}
                    <div className="flex flex-col gap-4">
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="bg-blue-600 p-2 rounded-lg group-hover:bg-blue-500 transition-colors">
                                <BookOpen className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                                NovelSpheres
                            </span>
                        </Link>
                        <p className="text-sm leading-relaxed text-gray-500 mt-2">
                            Nền tảng sáng tác và đọc truyện trực tuyến hàng đầu. Khám phá hàng ngàn câu chuyện đa dạng thể loại và kết nối với cộng đồng đam mê văn học lớn nhất.
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                            <a href="#" className="p-2 bg-gray-900 rounded-full hover:bg-blue-600 hover:text-white transition-all">
                                <Facebook className="w-5 h-5" />
                            </a>
                            <a href="#" className="p-2 bg-gray-900 rounded-full hover:bg-sky-500 hover:text-white transition-all">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="#" className="p-2 bg-gray-900 rounded-full hover:bg-pink-600 hover:text-white transition-all">
                                <Instagram className="w-5 h-5" />
                            </a>
                            <a href="#" className="p-2 bg-gray-900 rounded-full hover:bg-indigo-500 hover:text-white transition-all">
                                <Discord className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-white font-semibold mb-6 uppercase tracking-wider text-sm">Khám Phá</h3>
                        <ul className="space-y-3">
                            <li><Link href="#" className="text-sm hover:text-blue-400 transition-colors">Bảng Xếp Hạng</Link></li>
                            <li><Link href="#" className="text-sm hover:text-blue-400 transition-colors">Truyện Mới Cập Nhật</Link></li>
                            <li><Link href="#" className="text-sm hover:text-blue-400 transition-colors">Truyện Hoàn Thành</Link></li>
                            <li><Link href="#" className="text-sm hover:text-blue-400 transition-colors">Danh Sách Thể Loại</Link></li>
                            <li><Link href="#" className="text-sm hover:text-blue-400 transition-colors">Review Truyện</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-white font-semibold mb-6 uppercase tracking-wider text-sm">Dành Cho Tác Giả</h3>
                        <ul className="space-y-3">
                            <li><Link href="#" className="text-sm hover:text-blue-400 transition-colors">Hướng Dẫn Đăng Truyện</Link></li>
                            <li><Link href="#" className="text-sm hover:text-blue-400 transition-colors">Chính Sách Bản Quyền</Link></li>
                            <li><Link href="#" className="text-sm hover:text-blue-400 transition-colors">Studio Tác Giả</Link></li>
                            <li><Link href="#" className="text-sm hover:text-blue-400 transition-colors">Câu Hỏi Thường Gặp (FAQ)</Link></li>
                            <li><Link href="#" className="text-sm hover:text-blue-400 transition-colors">Cộng Đồng Support</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-white font-semibold mb-6 uppercase tracking-wider text-sm">Đăng Ký Nhận Tin</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Nhận thông báo về các sự kiện sáng tác và truyện được đề cử mỗi tuần.
                        </p>
                        <form className="flex flex-col gap-2">
                            <div className="relative">
                                <Mail className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="email"
                                    placeholder="Email của bạn..."
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>
                            <button
                                type="button"
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
                            >
                                Đăng ký ngay
                            </button>
                        </form>
                    </div>
                </div>

                <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-sm text-gray-500 text-center md:text-left">
                        © {new Date().getFullYear()} NovelSpheres. Khám phá câu chuyện yêu thích tiếp theo của bạn.
                    </div>
                    <div className="flex gap-6 text-sm text-gray-500">
                        <Link href="#" className="hover:text-white transition-colors">Điều khoản dịch vụ</Link>
                        <Link href="#" className="hover:text-white transition-colors">Chính sách bảo mật</Link>
                        <Link href="#" className="hover:text-white transition-colors">DMCA</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;