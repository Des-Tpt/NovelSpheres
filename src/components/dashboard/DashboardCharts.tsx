'use client';
import React from 'react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { motion } from 'framer-motion';

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
        { name: 'Người đọc', value: userStats.reader },
        { name: 'Tác gia', value: userStats.writer },
        { name: 'Quản trị viên', value: userStats.admin },
    ].filter(i => i.value > 0);

    const novelStatusData = [
        { name: 'Đang tiến hành', count: novelStats.status.ongoing },
        { name: 'Hoàn thành', count: novelStats.status.completed },
        { name: 'Tạm ngưng', count: novelStats.status.hiatus },
    ];

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white border border-gray-200 p-3 rounded-xl shadow-lg">
                    <p className="font-semibold text-gray-800">{label || payload[0].name}</p>
                    <p className="text-blue-600">{`${payload[0].value} User`}</p>
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
                className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-6"
            >
                <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Thành phần người dùng</h3>
                    <p className="text-sm text-gray-500 mt-1">Tỉ lệ phân bổ vai trò thành viên</p>
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
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <RechartsTooltip content={<CustomTooltip />} />
                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                iconType="circle"
                                formatter={(value, entry, index) => <span className="text-gray-700 font-medium">{value}</span>}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-6"
            >
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Tình trạng Tác phẩm</h3>
                        <p className="text-sm text-gray-500 mt-1">Phân bố tiến độ của các truyện</p>
                    </div>
                </div>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={novelStatusData}
                            margin={{ top: 20, right: 30, left: -20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                            <XAxis
                                dataKey="name"
                                stroke="#6b7280"
                                tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                stroke="#6b7280"
                                tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <RechartsTooltip
                                cursor={{ fill: '#f3f4f6', opacity: 0.8 }}
                                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                itemStyle={{ color: '#4f46e5', fontWeight: 600 }}
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
