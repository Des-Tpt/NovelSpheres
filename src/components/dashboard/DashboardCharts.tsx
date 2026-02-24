'use client';
import React from 'react';
import {
    PieChart, Pie, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { motion } from 'framer-motion';
import { Shapes } from 'lucide-react';

interface DashboardChartsProps {
    userStats: { reader: number, writer: number, admin: number };
    novelStats: {
        state: { draft: number, published: number };
        status: { ongoing: number, completed: number, hiatus: number };
    };
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ef4444', '#10b981', '#f59e0b'];

export default function DashboardCharts({ userStats, novelStats }: DashboardChartsProps) {
    const userData = [
        { name: 'Reader', value: userStats.reader },
        { name: 'Writer', value: userStats.writer },
        { name: 'Admin', value: userStats.admin },
    ].filter(i => i.value > 0);

    const novelStatusData = [
        { name: 'Ongoing', count: novelStats.status.ongoing },
        { name: 'Completed', count: novelStats.status.completed },
        { name: 'Hiatus', count: novelStats.status.hiatus },
    ];

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-gray-800 border border-gray-700 p-3 rounded-lg shadow-xl">
                    <p className="font-semibold text-gray-200">{label || payload[0].name}</p>
                    <p className="text-blue-400">{`${payload[0].value} User`}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6"
            >
                <div className="mb-6">
                    <h3 className="text-xl font-bold text-white">Thành phần người dùng</h3>
                    <p className="text-sm text-gray-400">Tỉ lệ phân bổ vai trò thành viên</p>
                </div>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={userData}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                            >
                                {userData.map((entry, index) => (
                                    <Shapes key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <RechartsTooltip content={<CustomTooltip />} />
                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                iconType="circle"
                                formatter={(value, entry, index) => <span className="text-gray-300">{value}</span>}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            {/* Chart 2: Novel Status */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6"
            >
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-white">Tình trạng Tác phẩm</h3>
                        <p className="text-sm text-gray-400">Phân bố tiến độ của các truyện</p>
                    </div>
                </div>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={novelStatusData}
                            margin={{ top: 20, right: 30, left: -20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                            <XAxis
                                dataKey="name"
                                stroke="#9ca3af"
                                tick={{ fill: '#9ca3af', fontSize: 12 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                stroke="#9ca3af"
                                tick={{ fill: '#9ca3af', fontSize: 12 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <RechartsTooltip
                                cursor={{ fill: '#374151', opacity: 0.4 }}
                                contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '8px' }}
                                itemStyle={{ color: '#60a5fa' }}
                            />
                            <Bar
                                dataKey="count"
                                fill="#8b5cf6"
                                radius={[6, 6, 0, 0]}
                                barSize={40}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

        </div>
    );
}
