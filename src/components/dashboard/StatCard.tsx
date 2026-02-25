import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatCardProps {
    title: string;
    count: number;
    growth: number;
    icon: LucideIcon;
    colorClass: string;
    delay?: number;
}

const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
};

export default function StatCard({ title, count, growth, icon: Icon, colorClass, delay = 0 }: StatCardProps) {
    const isPositive = growth >= 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5 }}
            className={`relative group bg-white rounded-2xl border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-${colorClass}-200 p-6 transition-all duration-300 overflow-hidden`}
        >
            {/* Background Glow Effect */}
            <div className={`absolute -inset-4 bg-gradient-to-r from-${colorClass}-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

            <div className="relative z-10 flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl bg-${colorClass}-500/20 text-${colorClass}-400`}>
                    <Icon className="w-6 h-6" />
                </div>

                {/* Growth Badge */}
                <div className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full ${isPositive
                    ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                    {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(growth)}%
                </div>
            </div>

            <div className="relative z-10">
                <h3 className="text-gray-500 text-sm font-medium mb-1">{title}</h3>
                <div className="text-3xl font-bold text-gray-900 tracking-tight">
                    {formatNumber(count)}
                </div>
            </div>
        </motion.div>
    );
}
