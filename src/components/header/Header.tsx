'use client'
import { BookOpenIcon, ChatBubbleLeftIcon, HomeIcon, UserIcon, XMarkIcon, Bars3Icon, ChevronDownIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import Button from '../ui/Button';
import { useEffect, useState, useRef } from 'react';
import SearchBar from '../ui/SearchBar';
import AuthForm from '../auth/AuthForm';
import { getUserFromCookies } from '@/action/userAction';
import getImage from '@/action/imageActions';
import Image from 'next/image';
import { ArrowRight, Book, Heart, History, HistoryIcon } from 'lucide-react';
import handleRole from '@/utils/handleRole';
import { AnimatePresence, motion } from 'framer-motion';
import NotificationComponent from '../notification/NotificationComponent';

interface User {
  _id: string;
  username: string;
  email?: string;
  role: string;
  publicId: string;
  format: string;
}

const Header = () => {
  const [activeButton, setActiveButton] = useState<String | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User>();
  const [userImage, setUserImage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleClick = (buttonId: string) => {
    setActiveButton(buttonId);
  };

  const handleCloseAuth = () => {
    setIsAuthOpen(false);
    setActiveButton(null);
  };

  const handleOpenSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleToggleUserDropdown = () => {
    setIsUserDropdownOpen(!isUserDropdownOpen);
  };

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      try {
        const response = await getUserFromCookies();
        if (response?.user) {
          setCurrentUser(response.user);
          console.log('header responsive: ', response)

          const imageUrl = await getImage(response.user.publicId, response.user.format);
          setUserImage(imageUrl);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      setIsUserDropdownOpen(false);

      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      window.location.href = '/';
    } catch (e) {
    }
  };

  return (
    <div>
      <header className="bg-black top-0 text-white px-[5%] py-2.5 fixed flex justify-between items-center md:px-[15%] w-full z-40">
        <div className="flex justify-center mr-2.5">
          <BookOpenIcon className="h-8 w-8" />
          <span className="text-2xl font-semibold pl-4">NovelSphere</span>
        </div>

        {/* Giao diện PC */}
        <div className="hidden md:flex gap-4">
          <Button
            type={<HomeIcon className="h-5 w-5" />}
            text="Trang chủ"
            href="/"
            onClick={() => handleClick('home')}
            isActive={activeButton === '1'}
          />
          <Button
            type={<ChatBubbleLeftIcon className="h-5 w-5" />}
            text="Diễn đàn"
            href="/forum"
            onClick={() => handleClick('forum')}
            isActive={activeButton === '1'}
          />
          <Button
            type={<Book className="h-5 w-5" />}
            text="Thư viện"
            href="/novels"
            onClick={() => handleClick('novels')}
            isActive={activeButton === '1'}
          />
        </div>

        <div className="hidden md:block w-[30%] justify-center relative">
          <SearchBar />
        </div>

        {/* Desktop Auth Section với Loading */}
        <div className="hidden md:flex items-center gap-5 relative" ref={dropdownRef}>
          {currentUser?._id &&
            <NotificationComponent userId={currentUser._id} />
          }

          {isLoading ? (
            // Hiển thị skeleton loading thay vì nút
            <div className="hidden md:flex items-center gap-2 p-2">
              <div className="w-8 h-8 bg-gray-600 rounded-full animate-pulse"></div>
              <div className="w-4 h-4 bg-gray-600 rounded animate-pulse"></div>
            </div>
          ) : currentUser ? (
            <div className="relative">
              <button
                onClick={handleToggleUserDropdown}
                className="flex items-center gap-2 hover:bg-gray-800 rounded-lg p-2 transition-colors"
              >
                {userImage && (
                  <Image
                    src={userImage}
                    alt={currentUser.username || 'avatar người dùng'}
                    width={32}
                    height={32}
                    className="rounded-full w-8 h-8 object-cover"
                  />
                )}
                <ChevronDownIcon className="h-4 w-4" />
              </button>
              {/* User Dropdown */}
              <AnimatePresence initial={false}>
                {isUserDropdownOpen && (
                  <motion.div
                    className="absolute right-0 mt-2 w-64 bg-gray-950 rounded-lg shadow-lg border overflow-hidden border-gray-200 z-70"
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.1, ease: 'easeOut' }}
                  >
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        {userImage && (
                          <Image
                            src={userImage}
                            alt={currentUser.username || 'avatar người dùng'}
                            width={48}
                            height={48}
                            className="rounded-full w-12 h-12 object-cover"
                          />
                        )}
                        <div className='hidden md:flex flex-col'>
                          <p className="text-white font-semibold">{currentUser.username}</p>
                          <p className='text-gray-100 text-sm'>{currentUser.email || "user@example.com"}</p>
                          <p className="text-gray-100 text-sm">{handleRole(currentUser.role)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="py-2">
                      <button className="cursor-pointer w-full flex items-center gap-3 px-4 py-2 text-gray-100 hover:bg-gray-600 transition-colors">
                        <UserIcon className="h-5 w-5" />
                        <span>Hồ sơ</span>
                      </button>
                      <button className="cursor-pointer w-full flex items-center gap-3 px-4 py-2 text-gray-100 hover:bg-gray-600 transition-colors">
                        <Heart className="h-5 w-5" />
                        <span>Yêu thích</span>
                      </button>
                      <button className="cursor-pointer w-full flex items-center gap-3 px-4 py-2 text-gray-100 hover:bg-gray-600 transition-colors">
                        <History className="h-5 w-5" />
                        <span>Lịch sử</span>
                      </button>
                      <button className="cursor-pointer w-full flex items-center gap-3 px-4 py-2 text-gray-100 hover:bg-gray-600 transition-colors">
                        <Cog6ToothIcon className="h-5 w-5" />
                        <span>Cài đặt</span>
                      </button>
                    </div>

                    <div className="py-2 border-t border-gray-200">
                      <button
                        onClick={handleLogout}
                        className="w-full flex cursor-pointer items-center gap-3 px-4 py-2 text-red-600 hover:bg-gray-600 transition-colors"
                      >
                        <ArrowRight className="h-5 w-5" />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div>
              <Button
                type={<UserIcon className="h-5 w-5" />}
                text="Đăng nhập"
                href="#"
                onClick={() => {
                  handleClick('login');
                  setIsAuthOpen(true);
                }}
                isActive={activeButton === 'login'}
              />
            </div>
          )}
        </div>

        {/* Mobile User Section - Chỉ hiển thị nút đăng nhập khi chưa đăng nhập */}
        <div className='md:hidden flex items-center gap-2'>
          {!isLoading && !currentUser && (
            <Button
              type={<UserIcon className="h-5 w-5" />}
              text="Đăng nhập"
              href="#"
              onClick={() => {
                handleClick('login');
                setIsAuthOpen(true);
                setIsSidebarOpen(false);
              }}
              isActive={activeButton === 'login'}
            />
          )}
        </div>

        {/* Sidebar */}
        <button onClick={handleOpenSidebar} className="md:hidden block ml-2">
          <Bars3Icon className="w-5 h-5" />
        </button>
      </header>

      {/* Searchbar trên điện thoại */}
      <div className="block md:hidden mt-2">
        <SearchBar />
      </div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 right-0 w-64 bg-black z-50 transform ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300 md:hidden`}>
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <span className="text-xl font-semibold">Menu</span>
          <button onClick={handleOpenSidebar}>
            <XMarkIcon className="h-8 w-8 cursor-pointer" />
          </button>
        </div>

        {/* User Info trong sidebar với Loading */}
        {isLoading ? (
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gray-600 rounded-full animate-pulse"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-600 rounded animate-pulse mb-2"></div>
                <div className="h-3 bg-gray-600 rounded animate-pulse w-3/4 mb-1"></div>
                <div className="h-3 bg-gray-600 rounded animate-pulse w-1/2"></div>
              </div>
            </div>
          </div>
        ) : currentUser ? (
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              {userImage && (
                <Image
                  src={userImage}
                  alt={currentUser.username || 'avatar người dùng'}
                  width={48}
                  height={48}
                  className="rounded-full w-12 h-12 object-cover"
                />
              )}
              <div>
                <p className="text-white font-semibold">{currentUser.username}</p>
                <p className="text-gray-300 text-sm">{currentUser.email || 'user@example.com'}</p>
                <p className="text-gray-400 text-xs">{handleRole(currentUser.role)}</p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-2 p-4">
          <Button
            type={<HomeIcon className="h-5 w-5" />}
            text="Trang chủ"
            href="/"
            onClick={() => {
              handleClick('home');
              setIsSidebarOpen(false);
            }}
            isActive={activeButton === 'home'}
          />
          <Button
            type={<ChatBubbleLeftIcon className="h-5 w-5" />}
            text="Diễn đàn"
            href="/forum"
            onClick={() => {
              handleClick('forum');
              setIsSidebarOpen(false);
            }}
            isActive={activeButton === 'forum'}
          />
          <Button
            type={<Book className="h-5 w-5" />}
            text="Danh sách"
            href="/novels"
            onClick={() => {
              handleClick('novels');
              setIsSidebarOpen(false);
            }}
            isActive={activeButton === 'novels'}
          />
          {/* User menu items trong sidebar */}
          {!isLoading && currentUser && (
            <>
              <div className="border-t border-gray-700 my-2"></div>
              <Button
                type={<UserIcon className="h-5 w-5" />}
                text="Hồ sơ"
                href="/profile"
                onClick={() => {
                  handleClick('profile');
                  setIsSidebarOpen(false);
                }}
                isActive={activeButton === 'profile'}
              />
              <Button
                type={<Heart className="h-5 w-5" />}
                text="Yêu thích"
                href="/favorite"
                onClick={() => {
                  handleClick('settings');
                  setIsSidebarOpen(false);
                }}
                isActive={activeButton === 'settings'}
              />
              <Button
                type={<HistoryIcon className="h-5 w-5" />}
                text="Lịch sử"
                href="/History"
                onClick={() => {
                  handleClick('settings');
                  setIsSidebarOpen(false);
                }}
                isActive={activeButton === 'settings'}
              />
              <Button
                type={<Cog6ToothIcon className="h-5 w-5" />}
                text="Cài đặt"
                href="/settings"
                onClick={() => {
                  handleClick('settings');
                  setIsSidebarOpen(false);
                }}
                isActive={activeButton === 'settings'}
              />
              <button
                onClick={() => {
                  handleLogout();
                  setIsSidebarOpen(false);
                }}
                className="flex items-center gap-3 px-3 py-2 text-red-400 hover:bg-gray-800 rounded-lg transition-colors text-left"
              >
                <ArrowRight className="h-5 w-5" />
                <span>Đăng xuất</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/*  Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black opacity-50 z-40 md:hidden" onClick={handleOpenSidebar}></div>
      )}

      <AuthForm isOpen={isAuthOpen} onClose={handleCloseAuth} />
    </div>
  );
};

export default Header;