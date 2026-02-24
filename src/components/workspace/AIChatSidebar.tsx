"use client";

import { useState, useRef, useCallback } from 'react';
import { X, Sparkles, RotateCcw, ClipboardPaste, ChevronDown, ChevronUp, Wand2, Loader2, Settings2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AIGenerationPanelProps {
    theme: 'light' | 'dark';
    editorContent: string;
    chapterInfo: { title: string; chapterNumber: number } | null;
    onClose: () => void;
    onInsert: (text: string) => void;
}

const generateMockText = (context: string, instruction: string, maxTokens: number): string => {
    const samples = [
        `Ánh trăng rọi qua khung cửa sổ, vẽ lên sàn nhà những vệt sáng bạc mờ ảo. Gió đêm lùa qua kẽ hở, mang theo hơi lạnh se sắt của mùa đông đang dần kéo tới. Trong căn phòng tối, chỉ có tiếng thở đều đặn phá vỡ sự tĩnh lặng.\n\nNhân vật chính mở mắt, đôi mắt sáng lên trong bóng tối như hai ngọn nến nhỏ. Một cảm giác bất an len lỏi trong lồng ngực — như thể có điều gì đó đang đến gần, điều gì đó không thể né tránh.`,

        `"Ngươi không nên ở đây," giọng nói vang lên từ phía sau, lạnh lẽo và xa cách.\n\nCô quay lại, bắt gặp đôi mắt đen thẫm đang nhìn mình chằm chằm. Người đàn ông đứng ở ngưỡng cửa, dáng vẻ cao gầy, khoác trên mình chiếc áo choàng sẫm màu. Khuôn mặt anh nửa sáng nửa tối dưới ánh đèn hành lang, khiến biểu cảm trở nên khó đoán.\n\n"Tôi có việc cần làm ở đây," cô đáp, cố giữ giọng bình thản dù tim đập nhanh hơn.`,

        `Con đường mòn xuyên qua khu rừng rậm, hai bên là những thân cây cổ thụ vươn cành như những cánh tay ma quái. Lá khô xào xạc dưới mỗi bước chân, tiếng vọng lan xa trong không gian yên ả đến rợn người.\n\nĐoàn người dừng lại trước một ngã ba. Bản đồ cũ kỹ trong tay đã bị mờ đi bởi thời gian, những ký hiệu trên đó gần như không thể đọc được nữa.\n\n"Rẽ trái," người dẫn đầu nói, giọng đầy quả quyết. Nhưng ánh mắt anh lại phản bội — một thoáng do dự lướt qua, nhanh đến mức gần như không ai nhận ra.`,

        `Tiếng chuông đồng hồ vang lên mười hai lần, báo hiệu nửa đêm. Thành phố dần chìm vào giấc ngủ, nhưng có những nơi không bao giờ ngừng hoạt động.\n\nQuán trà nhỏ ở góc phố vẫn sáng đèn. Bên trong, mùi trà nóng quyện với khói thuốc tạo nên một bầu không khí quen thuộc. Chủ quán — một ông lão tóc bạc — đang lau chiếc cốc thủy tinh, ánh mắt thỉnh thoảng liếc về phía cánh cửa.\n\nKhi cánh cửa mở ra, ông không tỏ vẻ ngạc nhiên. "Tôi đã đợi cậu," ông nói nhẹ nhàng.`,
    ];

    if (instruction.includes('hội thoại') || instruction.includes('dialogue')) {
        return samples[1];
    }
    if (instruction.includes('cảnh') || instruction.includes('mô tả') || instruction.includes('setting')) {
        return samples[2];
    }
    if (instruction.includes('bí ẩn') || instruction.includes('mystery')) {
        return samples[3];
    }
    return samples[Math.floor(Math.random() * samples.length)];
};

export default function AIGenerationPanel({ theme, editorContent, chapterInfo, onClose, onInsert }: AIGenerationPanelProps) {
    const [instruction, setInstruction] = useState('');
    const [generatedText, setGeneratedText] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [hasGenerated, setHasGenerated] = useState(false);

    const [temperature, setTemperature] = useState(0.8);
    const [maxTokens, setMaxTokens] = useState(512);
    const [topP, setTopP] = useState(0.9);
    const [repetitionPenalty, setRepetitionPenalty] = useState(1.15);

    const outputRef = useRef<HTMLDivElement>(null);

    const contextPreview = editorContent
        ?.replace(/<[^>]*>/g, '')
        ?.trim()
        ?.split(/\s+/)
        ?.slice(-80)
        ?.join(' ') || '';

    const handleGenerate = useCallback(async () => {
        if (isGenerating) return;

        setIsGenerating(true);
        setHasGenerated(true);
        setGeneratedText('');

        // Mock API delay — thay bằng fetch() thật khi kết nối AI
        await new Promise(resolve => setTimeout(resolve, 1500));

        const result = generateMockText(editorContent, instruction, maxTokens);
        setGeneratedText(result);
        setIsGenerating(false);
    }, [isGenerating, editorContent, instruction, maxTokens]);

    const handleRetry = () => {
        setGeneratedText('');
        handleGenerate();
    };

    const handleInsert = () => {
        if (generatedText) {
            onInsert(generatedText);
            setGeneratedText('');
            setHasGenerated(false);
        }
    };

    // Theme
    const bg = theme === 'light' ? 'bg-white' : 'bg-gray-900';
    const bgHeader = theme === 'light' ? 'bg-gradient-to-r from-violet-50 to-blue-50' : 'bg-gradient-to-r from-violet-950/40 to-blue-950/40';
    const border = theme === 'light' ? 'border-gray-200' : 'border-gray-800';
    const textPrimary = theme === 'light' ? 'text-gray-900' : 'text-white';
    const textMuted = theme === 'light' ? 'text-gray-500' : 'text-gray-400';
    const textDimmed = theme === 'light' ? 'text-gray-400' : 'text-gray-600';
    const inputBg = theme === 'light' ? 'bg-gray-50' : 'bg-gray-800/60';
    const inputBorder = theme === 'light' ? 'border-gray-200' : 'border-gray-700';
    const cardBg = theme === 'light' ? 'bg-gray-50' : 'bg-gray-800/40';
    const hoverBtn = theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-gray-800';
    const outputBg = theme === 'light' ? 'bg-amber-50/50 border-amber-200/60' : 'bg-amber-900/10 border-amber-700/30';
    const outputText = theme === 'light' ? 'text-gray-800' : 'text-gray-200';
    const sliderTrack = theme === 'light' ? 'bg-gray-200' : 'bg-gray-700';

    return (
        <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 400, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className={`h-full flex flex-col ${bg} border-l ${border} overflow-hidden flex-shrink-0`}
        >
            {/* Header */}
            <div className={`flex items-center justify-between px-4 py-3 border-b ${border} ${bgHeader} flex-shrink-0`}>
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-blue-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
                        <Wand2 size={15} className="text-white" />
                    </div>
                    <div>
                        <h3 className={`text-sm font-bold ${textPrimary}`}>AI Generation</h3>
                        <p className={`text-[10px] ${textMuted}`}>Sinh nội dung tự động</p>
                    </div>
                </div>
                <button onClick={onClose} className={`p-1.5 rounded-lg transition-colors ${textMuted} ${hoverBtn}`}>
                    <X size={16} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
                <div className="p-4 space-y-4">

                    {/* Context Preview */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>Ngữ cảnh</span>
                            {chapterInfo && (
                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${theme === 'light' ? 'bg-violet-100 text-violet-600' : 'bg-violet-900/30 text-violet-400'}`}>
                                    Ch.{chapterInfo.chapterNumber}
                                </span>
                            )}
                        </div>
                        <div className={`${cardBg} rounded-xl p-3 max-h-28 overflow-y-auto`}>
                            {contextPreview ? (
                                <p className={`text-xs ${textMuted} leading-relaxed italic`}>
                                    "...{contextPreview}"
                                </p>
                            ) : (
                                <p className={`text-xs ${textDimmed} text-center py-2`}>
                                    Chưa có nội dung. Hãy viết gì đó trong editor.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Instruction */}
                    <div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${textMuted} mb-1.5 block`}>
                            Chỉ thị <span className={textDimmed}>(tuỳ chọn)</span>
                        </span>
                        <textarea
                            value={instruction}
                            onChange={(e) => setInstruction(e.target.value)}
                            placeholder="VD: Viết thêm đoạn hội thoại, mô tả cảnh chiến đấu..."
                            rows={2}
                            className={`w-full px-3 py-2 ${inputBg} border ${inputBorder} rounded-xl text-sm ${textPrimary} placeholder:${textDimmed} outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all resize-none`}
                        />
                    </div>

                    {/* Settings Toggle */}
                    <div>
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className={`flex items-center gap-1.5 text-xs ${textMuted} ${hoverBtn} px-2 py-1 rounded-lg transition-colors`}
                        >
                            <Settings2 size={12} />
                            <span>Tham số</span>
                            {showSettings ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>

                        <AnimatePresence>
                            {showSettings && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                >
                                    <div className={`${cardBg} rounded-xl p-3 mt-2 space-y-3`}>
                                        {/* Temperature */}
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className={`text-[10px] font-semibold ${textMuted}`}>Temperature</span>
                                                <span className={`text-[10px] font-mono ${textPrimary}`}>{temperature.toFixed(2)}</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0.1"
                                                max="1.5"
                                                step="0.05"
                                                value={temperature}
                                                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                                                className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-violet-500"
                                                style={{ background: `linear-gradient(to right, rgb(139, 92, 246) ${((temperature - 0.1) / 1.4) * 100}%, ${theme === 'light' ? '#e5e7eb' : '#374151'} ${((temperature - 0.1) / 1.4) * 100}%)` }}
                                            />
                                            <div className={`flex justify-between text-[9px] ${textDimmed} mt-0.5`}>
                                                <span>Chính xác</span>
                                                <span>Sáng tạo</span>
                                            </div>
                                        </div>

                                        {/* Max Tokens */}
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className={`text-[10px] font-semibold ${textMuted}`}>Độ dài tối đa</span>
                                                <span className={`text-[10px] font-mono ${textPrimary}`}>{maxTokens} tokens</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="128"
                                                max="2048"
                                                step="64"
                                                value={maxTokens}
                                                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                                                className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-violet-500"
                                                style={{ background: `linear-gradient(to right, rgb(139, 92, 246) ${((maxTokens - 128) / 1920) * 100}%, ${theme === 'light' ? '#e5e7eb' : '#374151'} ${((maxTokens - 128) / 1920) * 100}%)` }}
                                            />
                                            <div className={`flex justify-between text-[9px] ${textDimmed} mt-0.5`}>
                                                <span>Ngắn</span>
                                                <span>Dài</span>
                                            </div>
                                        </div>

                                        {/* Top P */}
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className={`text-[10px] font-semibold ${textMuted}`}>Top-p</span>
                                                <span className={`text-[10px] font-mono ${textPrimary}`}>{topP.toFixed(2)}</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0.5"
                                                max="1.0"
                                                step="0.05"
                                                value={topP}
                                                onChange={(e) => setTopP(parseFloat(e.target.value))}
                                                className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-violet-500"
                                                style={{ background: `linear-gradient(to right, rgb(139, 92, 246) ${((topP - 0.5) / 0.5) * 100}%, ${theme === 'light' ? '#e5e7eb' : '#374151'} ${((topP - 0.5) / 0.5) * 100}%)` }}
                                            />
                                        </div>

                                        {/* Repetition Penalty */}
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className={`text-[10px] font-semibold ${textMuted}`}>Repetition Penalty</span>
                                                <span className={`text-[10px] font-mono ${textPrimary}`}>{repetitionPenalty.toFixed(2)}</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="1.0"
                                                max="1.5"
                                                step="0.05"
                                                value={repetitionPenalty}
                                                onChange={(e) => setRepetitionPenalty(parseFloat(e.target.value))}
                                                className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-violet-500"
                                                style={{ background: `linear-gradient(to right, rgb(139, 92, 246) ${((repetitionPenalty - 1.0) / 0.5) * 100}%, ${theme === 'light' ? '#e5e7eb' : '#374151'} ${((repetitionPenalty - 1.0) / 0.5) * 100}%)` }}
                                            />
                                            <div className={`flex justify-between text-[9px] ${textDimmed} mt-0.5`}>
                                                <span>Cho phép lặp</span>
                                                <span>Hạn chế lặp</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Generate Button */}
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating || !contextPreview}
                        className={`w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-300 ${isGenerating
                            ? 'bg-violet-600/80 text-white cursor-wait'
                            : !contextPreview
                                ? (theme === 'light' ? 'bg-gray-100 text-gray-400' : 'bg-gray-800 text-gray-600') + ' cursor-not-allowed'
                                : 'bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 active:scale-[0.98]'
                            }`}
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                <span>Đang sinh...</span>
                            </>
                        ) : (
                            <>
                                <Sparkles size={16} />
                                <span>Sinh nội dung</span>
                            </>
                        )}
                    </button>

                    {/* Output Area */}
                    {hasGenerated && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="flex items-center justify-between mb-1.5">
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>Kết quả</span>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={handleRetry}
                                        disabled={isGenerating}
                                        className={`p-1 rounded-md transition-colors ${textMuted} ${hoverBtn} disabled:opacity-30`}
                                        title="Thử lại"
                                    >
                                        <RotateCcw size={12} />
                                    </button>
                                </div>
                            </div>
                            <div
                                ref={outputRef}
                                className={`${outputBg} border rounded-xl p-3 max-h-60 overflow-y-auto`}
                            >
                                <p className={`text-sm ${outputText} leading-relaxed whitespace-pre-wrap`}>
                                    {generatedText}
                                </p>
                            </div>

                            {/* Insert Button */}
                            {generatedText && !isGenerating && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="mt-2"
                                >
                                    <button
                                        onClick={handleInsert}
                                        className={`w-full py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all ${theme === 'light'
                                            ? 'bg-gray-900 hover:bg-gray-800 text-white'
                                            : 'bg-white hover:bg-gray-100 text-gray-900'
                                            } active:scale-[0.98]`}
                                    >
                                        <ClipboardPaste size={14} />
                                        <span>Chèn vào editor</span>
                                    </button>
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className={`px-4 py-2 border-t ${border} flex-shrink-0`}>
                <p className={`text-[10px] ${textDimmed} text-center`}>
                    Nội dung sinh tự động • Có thể chỉnh sửa sau khi chèn
                </p>
            </div>
        </motion.div>
    );
}
