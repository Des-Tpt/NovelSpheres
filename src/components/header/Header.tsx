'use client'
import { BookOpenIcon, ChatBubbleLeftIcon, HomeIcon, UserIcon, XMarkIcon, Bars3Icon } from '@heroicons/react/24/outline';
import Button from '../ui/Button';
import { useState } from 'react';
import SearchBar from '../ui/SearchBar';
import AuthForm from '../auth/AuthForm';

const Header = () => {
  const [activeButton, setActiveButton] = useState<String | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

  return (
    <div>
      <header className="bg-black text-white px-[5%] py-2.5 flex justify-between items-center md:px-[15%]">
        <link href="https://fonts.googleapis.com/css2?family=Crimson+Text&display=swap" rel="stylesheet" />
        <div className="flex justify-center mr-2.5">
          <BookOpenIcon className="h-8 w-8" />
          <span className="font-['Crimson_Text'] text-2xl font-semibold pl-4">NovelSphere</span>
        </div>

        {/* Giao diện PC */}
        <div className="hidden md:flex gap-4">
          <Button
            type={<HomeIcon className="h-5 w-5" />}
            text="Trang chủ"
            href="/"
            onClick={() => handleClick('home')}
            isActive={activeButton === 'home'}
          />
          <Button
            type={<ChatBubbleLeftIcon className="h-5 w-5" />}
            text="Diễn đàn"
            href="/forum"
            onClick={() => handleClick('forum')}
            isActive={activeButton === 'forum'}
          />
        </div>

        {/* SearchBar trên PC */}
        <div className="hidden md:block w-[30%] justify-center relative">
          <SearchBar />
        </div>

        {/* Login trên PC */}
        <div className="hidden md:block font-['Crimson_Text']">
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
        <div className='md:hidden flex ml-20'>
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
        </div>
        {/* Sidebar */}
        <button onClick={handleOpenSidebar} className="md:hidden block">
          <Bars3Icon className="w-5 h-5" />
        </button>
      </header>

      {/* Searchbar trên điện thoại */}
      <div className="block md:hidden mt-2">
        <SearchBar />
      </div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 right-0 w-48 bg-black z-50 transform ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300 md:hidden`}>
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <span className="font-['Crimson_Text'] text-xl font-semibold">Menu</span>
          <button onClick={handleOpenSidebar}>
            <XMarkIcon className="h-8 w-8 cursor-pointer" />
          </button>
        </div>
        <div className="flex flex-col gap-4 p-4">
          <Button
            type={<HomeIcon className="h-5 w-5" />}
            text="Trang chủ"
            href="/"
            onClick={() => handleClick('home')}
            isActive={activeButton === 'home'}
          />
          <Button
            type={<ChatBubbleLeftIcon className="h-5 w-5" />}
            text="Diễn đàn"
            href="#"
            onClick={() => handleClick('forum')}
            isActive={activeButton === 'forum'}
          />
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