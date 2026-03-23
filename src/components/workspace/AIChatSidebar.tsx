"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Sparkles, RotateCcw, ClipboardPaste, ChevronDown, ChevronUp, Wand2, Loader2, Settings2, Square, Wifi, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AIGenerationPanelProps {
    theme: 'light' | 'dark';
    editorContent: string;
    chapterInfo: { title: string; chapterNumber: number } | null;
    onClose: () => void;
    onInsert: (text: string) => void;
}

type OllamaStatus = 'checking' | 'connected' | 'disconnected';

export default function AIGenerationPanel({ theme, editorContent, chapterInfo, onClose, onInsert }: AIGenerationPanelProps) {
    const [instruction, setInstruction] = useState('');
    const [generatedText, setGeneratedText] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [hasGenerated, setHasGenerated] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus>('checking');
    const [modelName, setModelName] = useState('');

    // Params mặc định khớp Modelfile
    const [temperature, setTemperature] = useState(0.6);
    const [maxTokens, setMaxTokens] = useState(100);
    const [topP, setTopP] = useState(0.9);
    const [repetitionPenalty, setRepetitionPenalty] = useState(1.15);

    const outputRef = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Lấy context: 80 từ cuối từ editor (strip HTML)
    const contextPreview = editorContent
        ?.replace(/<[^>]*>/g, '')
        ?.trim()
        ?.split(/\s+/)
        ?.slice(-80)
        ?.join(' ') || '';

    // Health check Ollama khi mount
    useEffect(() => {
        checkOllamaStatus();
    }, []);

    const checkOllamaStatus = async () => {
        setOllamaStatus('checking');
        try {
            const res = await fetch('/api/workspace/ai-generate', {
                signal: AbortSignal.timeout(5000),
            });
            const data = await res.json();
            if (data.status === 'connected') {
                setOllamaStatus('connected');
                setModelName(data.activeModel || '');
            } else {
                setOllamaStatus('disconnected');
            }
        } catch {
            setOllamaStatus('disconnected');
        }
    };

    // Gọi Ollama streaming
    const handleGenerate = useCallback(async () => {
        if (isGenerating) return;

        setIsGenerating(true);
        setHasGenerated(true);
        setGeneratedText('');
        setError(null);

        // Tạo AbortController để có thể huỷ
        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            // Xây prompt: context + instruction (nếu có)
            let prompt = contextPreview;
            if (instruction.trim()) {
                prompt = `[Chỉ thị: ${instruction.trim()}]\n\nBối cảnh:\n${contextPreview}`;
            }

            const res = await fetch('/api/workspace/ai-generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
                    temperature,
                    num_predict: maxTokens,
                    top_p: topP,
                    repeat_penalty: repetitionPenalty,
                }),
                signal: controller.signal,
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
                throw new Error(errData.error || `Lỗi ${res.status}`);
            }

            if (!res.body) {
                throw new Error('Không nhận được stream từ server');
            }

            // Đọc stream từng chunk
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let fullText = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                fullText += chunk;
                setGeneratedText(fullText);

                // Auto-scroll output
                if (outputRef.current) {
                    outputRef.current.scrollTop = outputRef.current.scrollHeight;
                }
            }
        } catch (err: any) {
            if (err.name === 'AbortError') {
                // User đã nhấn Stop — không hiện lỗi
                return;
            }
            setError(err.message || 'Lỗi không xác định');
            setOllamaStatus('disconnected');
        } finally {
            setIsGenerating(false);
            abortControllerRef.current = null;
        }
    }, [isGenerating, contextPreview, instruction, temperature, maxTokens, topP, repetitionPenalty]);

    const handleStop = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            setIsGenerating(false);
        }
    };

    const handleRetry = () => {
        setGeneratedText('');
        setError(null);
        handleGenerate();
    };

    const handleInsert = () => {
        if (generatedText) {
            onInsert(generatedText);
            setGeneratedText('');
            setHasGenerated(false);
        }
    };

    // Theme tokens
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
                        <div className="flex items-center gap-1.5">
                            <p className={`text-[10px] ${textMuted}`}>Ollama</p>
                            {ollamaStatus === 'connected' && (
                                <span className="flex items-center gap-0.5 text-[9px] text-emerald-500">
                                    <Wifi size={8} />
                                    <span>{modelName}</span>
                                </span>
                            )}
                            {ollamaStatus === 'disconnected' && (
                                <button
                                    onClick={checkOllamaStatus}
                                    className="flex items-center gap-0.5 text-[9px] text-red-400 hover:text-red-300 transition-colors"
                                >
                                    <WifiOff size={8} />
                                    <span>Mất kết nối</span>
                                </button>
                            )}
                            {ollamaStatus === 'checking' && (
                                <span className="flex items-center gap-0.5 text-[9px] text-yellow-500">
                                    <Loader2 size={8} className="animate-spin" />
                                    <span>Đang kiểm tra...</span>
                                </span>
                            )}
                        </div>
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
                                    &quot;...{contextPreview}&quot;
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
                            placeholder="VD: Nhân vật chính rút kiếm phản công, mô tả cảnh truy đuổi..."
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

                                        {/* Max Tokens (num_predict) */}
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className={`text-[10px] font-semibold ${textMuted}`}>Độ dài tối đa</span>
                                                <span className={`text-[10px] font-mono ${textPrimary}`}>{maxTokens} tokens</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="50"
                                                max="500"
                                                step="10"
                                                value={maxTokens}
                                                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                                                className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-violet-500"
                                                style={{ background: `linear-gradient(to right, rgb(139, 92, 246) ${((maxTokens - 50) / 450) * 100}%, ${theme === 'light' ? '#e5e7eb' : '#374151'} ${((maxTokens - 50) / 450) * 100}%)` }}
                                            />
                                            <div className={`flex justify-between text-[9px] ${textDimmed} mt-0.5`}>
                                                <span>Ngắn (50)</span>
                                                <span>Dài (500)</span>
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

                                        {/* Repeat Penalty */}
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className={`text-[10px] font-semibold ${textMuted}`}>Repeat Penalty</span>
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

                    {/* Error Message */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`rounded-xl p-3 text-xs ${theme === 'light' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-red-900/20 text-red-400 border border-red-800/40'}`}
                        >
                            <p className="font-medium mb-1">⚠ Lỗi kết nối</p>
                            <p>{error}</p>
                            <button
                                onClick={() => { setError(null); checkOllamaStatus(); }}
                                className="mt-2 text-[10px] underline opacity-80 hover:opacity-100"
                            >
                                Thử kết nối lại
                            </button>
                        </motion.div>
                    )}

                    {/* Generate / Stop Button */}
                    {isGenerating ? (
                        <button
                            onClick={handleStop}
                            className="w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-300 bg-red-600 hover:bg-red-700 text-white active:scale-[0.98]"
                        >
                            <Square size={14} fill="currentColor" />
                            <span>Dừng sinh</span>
                        </button>
                    ) : (
                        <button
                            onClick={handleGenerate}
                            disabled={!contextPreview || ollamaStatus === 'disconnected'}
                            className={`w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-300 ${
                                !contextPreview || ollamaStatus === 'disconnected'
                                    ? (theme === 'light' ? 'bg-gray-100 text-gray-400' : 'bg-gray-800 text-gray-600') + ' cursor-not-allowed'
                                    : 'bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 active:scale-[0.98]'
                            }`}
                        >
                            <Sparkles size={16} />
                            <span>Sinh nội dung</span>
                        </button>
                    )}

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
                                {generatedText ? (
                                    <p className={`text-sm ${outputText} leading-relaxed whitespace-pre-wrap`}>
                                        {generatedText}
                                        {isGenerating && (
                                            <span className="inline-block w-1.5 h-4 ml-0.5 bg-violet-500 animate-pulse rounded-sm align-middle" />
                                        )}
                                    </p>
                                ) : isGenerating ? (
                                    <div className="flex items-center justify-center py-3 gap-2">
                                        <Loader2 size={14} className={`animate-spin ${textMuted}`} />
                                        <span className={`text-xs ${textMuted}`}>Đang chờ phản hồi từ Ollama...</span>
                                    </div>
                                ) : null}
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
                    Ollama Local • Nội dung sinh tự động • Có thể chỉnh sửa sau khi chèn
                </p>
            </div>
        </motion.div>
    );
}
