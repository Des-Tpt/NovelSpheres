import { useSettingChapterStore } from '@/store/settingChapterStore';
import React, { useState, useEffect } from 'react';
import { X, Settings, Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Store {
    fontSize: number;
    fontFamily: string;
    lineSpacing: number;
    nightMode: 'light' | 'dark';
}

interface SettingChapterStore extends Store {
    setSettingChapterStore: (payload: Partial<Store>) => void;
}

export type ChapterSettingPopupProps = {
    isOpen: boolean;
    onClose: () => void;
};

export default function ChapterSettingPopup({ isOpen, onClose }: ChapterSettingPopupProps) {
    const { fontSize, fontFamily, lineSpacing, nightMode, setSettingChapterStore } = useSettingChapterStore();

    // Local states for immediate UI feedback
    const [localFontSize, setLocalFontSize] = useState<number>(fontSize);
    const [localFontFamily, setLocalFontFamily] = useState<string>(fontFamily);
    const [localLineSpacing, setLocalLineSpacing] = useState<number>(lineSpacing);
    const [localNightMode, setLocalNightMode] = useState<'light' | 'dark'>(nightMode);

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

    // Sync local states when popup opens
    useEffect(() => {
        if (isOpen) {
            setLocalFontSize(fontSize);
            setLocalFontFamily(fontFamily);
            setLocalLineSpacing(lineSpacing);
            setLocalNightMode(nightMode);
        }
    }, [isOpen, fontSize, fontFamily, lineSpacing, nightMode]);

    // Reset to default values
    const handleResetDefaults = () => {
        setLocalFontSize(16);
        setLocalFontFamily('serif');
        setLocalLineSpacing(1.6);
        setLocalNightMode('light');
    };

    // Apply changes without closing
    const handleApply = () => {
        setSettingChapterStore({
            fontSize: localFontSize,
            fontFamily: localFontFamily,
            lineSpacing: +localLineSpacing.toFixed(2),
            nightMode: localNightMode,
        });
    };

    // Save and close
    const handleSaveAndClose = () => {
        setSettingChapterStore({
            fontSize: localFontSize,
            fontFamily: localFontFamily,
            lineSpacing: +localLineSpacing.toFixed(2),
            nightMode: localNightMode,
        });
        onClose();
    };

    // Handle backdrop click
    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    // Handle ESC key
    useEffect(() => {
        const handleEscKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscKey);
        }

        return () => {
            document.removeEventListener('keydown', handleEscKey);
        };
    }, [isOpen]);

    return (
        <>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-70 p-0 sm:p-4"
                    onClick={handleBackdropClick}
                    style={{
                        backdropFilter: 'blur(2px)',
                        WebkitBackdropFilter: 'blur(2px)'
                    }}
                >
                    <motion.div
                        initial={{
                            scale: 1,
                            opacity: 0,
                            y: window.innerWidth <= 640 ? '100%' : 20
                        }}
                        animate={{
                            scale: 1,
                            opacity: 1,
                            y: 0
                        }}
                        exit={{
                            scale: 1,
                            opacity: 0,
                            y: window.innerWidth <= 640 ? '100%' : 20
                        }}
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 25,
                            duration: 0.3
                        }}
                        className={`w-full sm:w-full sm:max-w-2xl sm:max-h-[90vh] h-full sm:h-auto flex flex-col
                            sm:rounded-lg border-0 sm:border overflow-hidden ${nightMode === 'dark'
                                ? 'bg-gray-900 sm:border-gray-300'
                                : 'bg-amber-50 sm:border-gray-700'
                            }`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header - Fixed on mobile */}
                        <div className={`flex items-center justify-between p-4 sm:p-6 sm:mb-0 border-b sm:border-none ${nightMode === 'dark' ? 'border-gray-700' : 'border-gray-300'
                            }`}>
                            <div className="flex items-center gap-2">
                                <Settings className="w-5 h-5 text-orange-500" />
                                <h2 className={`text-lg font-semibold ${nightMode === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    Cài đặt đọc truyện
                                </h2>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={onClose}
                                className={`p-2 rounded-full transition-colors cursor-pointer ${nightMode === 'dark'
                                        ? 'text-gray-400 hover:text-yellow-300 hover:bg-gray-800'
                                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
                                    }`}
                            >
                                <X size={20} />
                            </motion.button>
                        </div>

                        {/* Content - Scrollable on mobile */}
                        <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4">
                            <div className="space-y-6 sm:space-y-6">
                                {/* Font Size */}
                                <motion.div
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    <label className={`block text-sm font-medium mb-3 ${nightMode === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                        }`}>
                                        Kích thước chữ
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="range"
                                            min={12}
                                            max={40}
                                            step={1}
                                            value={localFontSize}
                                            onChange={(e) => setLocalFontSize(Number(e.target.value))}
                                            className="flex-1 accent-orange-500 h-2"
                                        />
                                        <div className={`w-16 text-right text-sm font-medium px-3 py-2 rounded ${nightMode === 'dark'
                                                ? 'text-white bg-black'
                                                : 'text-gray-900 bg-gray-200'
                                            }`}>
                                            {localFontSize}px
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Line Spacing */}
                                <motion.div
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <label className={`block text-sm font-medium mb-3 ${nightMode === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                        }`}>
                                        Khoảng cách dòng
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="range"
                                            min={1}
                                            max={2}
                                            step={0.05}
                                            value={localLineSpacing}
                                            onChange={(e) => setLocalLineSpacing(Number(e.target.value))}
                                            className="flex-1 accent-orange-500 h-2"
                                        />
                                        <div className={`w-16 text-right text-sm font-medium px-3 py-2 rounded ${nightMode === 'dark'
                                                ? 'text-white bg-black'
                                                : 'text-gray-900 bg-gray-200'
                                            }`}>
                                            {localLineSpacing.toFixed(2)}
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Font Family */}
                                <motion.div
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <label className={`block text-sm font-medium mb-3 ${nightMode === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                        }`}>
                                        Phông chữ
                                    </label>
                                    <select
                                        value={localFontFamily}
                                        onChange={(e) => setLocalFontFamily(e.target.value)}
                                        className={`w-full px-4 py-3 border-2 border-blue-500 rounded-lg focus:outline-none focus:border-blue-400 transition-colors text-base ${nightMode === 'dark'
                                                ? 'bg-black text-white'
                                                : 'bg-white text-gray-900'
                                            }`}
                                    >
                                        <option value="serif">Serif (Times, Georgia)</option>
                                        <option value="sans-serif">Sans-serif (Arial, Inter)</option>
                                        <option value="monospace">Monospace</option>
                                        <option value="system-ui">System UI</option>
                                    </select>
                                </motion.div>

                                {/* Night Mode */}
                                <motion.div
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    <label className={`block text-sm font-medium mb-3 ${nightMode === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                        }`}>
                                        Chế độ hiển thị
                                    </label>
                                    <div className="flex gap-3">
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setLocalNightMode('light')}
                                            className={`flex-1 px-4 py-4 rounded-lg border-2 transition-all flex items-center justify-center gap-2 text-base font-medium ${localNightMode === 'light'
                                                    ? 'border-orange-500 bg-orange-500/20 text-orange-300'
                                                    : 'border-gray-600 text-gray-400 hover:border-gray-500'
                                                }`}
                                        >
                                            <Sun size={18} />
                                            Sáng
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setLocalNightMode('dark')}
                                            className={`flex-1 px-4 py-4 rounded-lg border-2 transition-all flex items-center justify-center gap-2 text-base font-medium ${localNightMode === 'dark'
                                                    ? 'border-orange-500 bg-orange-500/20 text-orange-300'
                                                    : 'border-gray-600 text-gray-400 hover:border-gray-500'
                                                }`}
                                        >
                                            <Moon size={18} />
                                            Tối
                                        </motion.button>
                                    </div>
                                </motion.div>

                                {/* Preview */}
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                    className={`border rounded-lg p-4 ${nightMode === 'dark' ? 'border-gray-600' : 'border-gray-300'
                                        }`}
                                >
                                    <div className={`mb-2 text-sm ${nightMode === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                        Xem trước
                                    </div>
                                    <div
                                        className={`p-4 rounded border max-h-32 overflow-auto ${localNightMode === 'dark'
                                                ? 'bg-gray-800 border-gray-700 text-gray-200'
                                                : 'bg-white border-gray-300 text-gray-900'
                                            }`}
                                        style={{
                                            fontSize: `${localFontSize}px`,
                                            fontFamily: localFontFamily === 'system-ui'
                                                ? 'system-ui, -apple-system, "Segoe UI", Roboto'
                                                : localFontFamily,
                                            lineHeight: localLineSpacing,
                                        }}
                                    >
                                        <p>
                                            Đây là bản xem trước văn bản. Bạn có thể điều chỉnh kích thước chữ,
                                            khoảng cách dòng, phông chữ và chế độ hiển thị để có trải nghiệm đọc tốt nhất.
                                            Những thay đổi sẽ được áp dụng ngay lập tức trong bản xem trước này.
                                        </p>
                                    </div>
                                </motion.div>

                                {/* Spacer for mobile to prevent content hiding behind fixed buttons */}
                                <div className="h-24 sm:hidden"></div>
                            </div>
                        </div>

                        {/* Action Buttons - Fixed at bottom on mobile */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className={`p-4 sm:p-6 sm:pt-4 border-t sm:border-none bg-inherit ${nightMode === 'dark' ? 'border-gray-700' : 'border-gray-300'
                                }`}
                        >
                            {/* Mobile Layout */}
                            <div className="sm:hidden space-y-3">
                                {/* Top row: Reset + Apply */}
                                <div className="flex gap-3">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleResetDefaults}
                                        className={`flex-1 px-4 py-4 border-2 rounded-lg transition-colors text-base font-medium ${nightMode === 'dark'
                                                ? 'border-gray-600 text-gray-300 hover:bg-gray-800'
                                                : 'border-gray-400 text-gray-700 hover:bg-gray-100'
                                            }`}
                                    >
                                        Đặt lại mặc định
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleApply}
                                        className="flex-1 px-4 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-base font-medium"
                                    >
                                        Áp dụng
                                    </motion.button>
                                </div>

                                {/* Bottom row: Cancel + Save */}
                                <div className="flex gap-3">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={onClose}
                                        className={`flex-1 px-4 py-4 border-2 rounded-lg transition-colors text-base font-medium ${nightMode === 'dark'
                                                ? 'border-gray-600 text-white hover:bg-gray-800'
                                                : 'border-gray-400 text-gray-900 hover:bg-gray-100'
                                            }`}
                                    >
                                        Hủy
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleSaveAndClose}
                                        className="flex-1 px-4 py-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-base font-medium"
                                    >
                                        Lưu cài đặt
                                    </motion.button>
                                </div>
                            </div>

                            {/* Desktop Layout */}
                            <div className="hidden sm:flex flex-col sm:flex-row gap-3">
                                {/* Left side buttons */}
                                <div className="flex gap-3">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleResetDefaults}
                                        className={`px-4 py-2 border rounded transition-colors ${nightMode === 'dark'
                                                ? 'border-gray-600 text-gray-300 hover:bg-gray-800'
                                                : 'border-gray-400 text-gray-700 hover:bg-gray-100'
                                            }`}
                                    >
                                        Đặt lại mặc định
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleApply}
                                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                    >
                                        Áp dụng
                                    </motion.button>
                                </div>

                                {/* Right side buttons */}
                                <div className="flex gap-3 sm:ml-auto">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={onClose}
                                        className={`flex-1 sm:flex-none px-4 py-2 border rounded transition-colors ${nightMode === 'dark'
                                                ? 'border-gray-600 text-white hover:bg-gray-800'
                                                : 'border-gray-400 text-gray-900 hover:bg-gray-100'
                                            }`}
                                    >
                                        Hủy
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleSaveAndClose}
                                        className="flex-1 sm:flex-none px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                                    >
                                        Lưu cài đặt
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </motion.div>
            )}
        </>
    );
}