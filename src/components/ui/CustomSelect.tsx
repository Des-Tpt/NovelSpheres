import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Option<T> = {
    value: T;
    label: string;
};

type CustomSelectProps<T> = {
    value: T;
    onChange: (value: T) => void;
    options: Option<T>[];
    placeholder: T;
};

const CustomSelect = <T extends string | number>({ 
    value, 
    onChange, 
    options, 
    placeholder 
}: CustomSelectProps<T>) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button 
                className="border border-gray-600 pl-2 pr-3.5 py-1 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-gray-950 w-fit text-left flex justify-between items-center gap-2"
                onClick={() => setIsOpen(!isOpen)}
                type="button"
            >
                <span className="whitespace-nowrap">
                    {value !== undefined && value !== null && value !== '' 
                        ? options.find(opt => opt.value === value)?.label 
                        : placeholder
                    }
                </span>
                <svg className={`w-4 h-4 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute z-30 min-w-full w-fit mt-1 bg-gray-950 border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
                    >
                        {options.map((option) => (
                            <div
                                key={String(option.value)}
                                className="px-3 py-2 hover:bg-gray-800 cursor-pointer transition-colors duration-150 border-b border-gray-100 last:border-b-0 whitespace-nowrap"
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                            >
                                {option.label}
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CustomSelect;