'use client'
import React from 'react';
import { Search, Filter, Calendar, Book, Clock, X } from 'lucide-react';

interface FilterOptions {
    search: string;
    sortBy: 'lastRead' | 'title';
    sortOrder: 'asc' | 'desc';
    dateRange: 'all' | 'today' | 'week' | 'month' | 'year';
    status: 'all' | 'ongoing' | 'completed' | 'hiatus';
}

interface HistoryFilterProps {
    filters: FilterOptions;
    onFiltersChange: (filters: FilterOptions) => void;
    totalCount: number;
}

const HistoryFilter: React.FC<HistoryFilterProps> = ({
    filters,
    onFiltersChange,
    totalCount
}) => {
    const handleSearchChange = (value: string) => {
        onFiltersChange({ ...filters, search: value });
    };

    const handleSortChange = (sortBy: FilterOptions['sortBy'], sortOrder: FilterOptions['sortOrder']) => {
        onFiltersChange({ ...filters, sortBy, sortOrder });
    };

    const handleDateRangeChange = (dateRange: FilterOptions['dateRange']) => {
        onFiltersChange({ ...filters, dateRange });
    };

    const handleStatusChange = (status: FilterOptions['status']) => {
        onFiltersChange({ ...filters, status });
    };

    const clearFilters = () => {
        onFiltersChange({
            search: '',
            sortBy: 'lastRead',
            sortOrder: 'desc',
            dateRange: 'all',
            status: 'all'
        });
    };

    const hasActiveFilters = filters.search ||
        filters.dateRange !== 'all' ||
        filters.status !== 'all' ||
        filters.sortBy !== 'lastRead' ||
        filters.sortOrder !== 'desc';

    return (
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 mb-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <Filter className="w-5 h-5 text-gray-400" />
                    <h3 className="text-white font-medium">Bộ lọc lịch sử đọc</h3>
                    <span className="bg-blue-600 text-white text-sm px-3 py-1 rounded-full">
                        {totalCount} truyện
                    </span>
                </div>

                {hasActiveFilters && (
                    <button
                        onClick={clearFilters}
                        className="flex items-center gap-2 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors text-sm"
                    >
                        <X className="w-4 h-4" />
                        Xóa bộ lọc
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm truyện..."
                        value={filters.search}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* Sort By */}
                <div className="flex gap-2">
                    <select
                        value={filters.sortBy}
                        onChange={(e) => handleSortChange(e.target.value as FilterOptions['sortBy'], filters.sortOrder)}
                        className="flex-1 px-3 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="lastRead">Thời gian đọc</option>
                        <option value="title">Tên truyện</option>
                        <option value="chapter">Chương</option>
                    </select>

                    <button
                        onClick={() => handleSortChange(filters.sortBy, filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                        className="px-3 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white hover:bg-gray-700 transition-colors"
                        title={filters.sortOrder === 'asc' ? 'Tăng dần' : 'Giảm dần'}
                    >
                        {filters.sortOrder === 'asc' ? '↑' : '↓'}
                    </button>
                </div>

                {/* Date Range */}
                <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                        value={filters.dateRange}
                        onChange={(e) => handleDateRangeChange(e.target.value as FilterOptions['dateRange'])}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">Tất cả thời gian</option>
                        <option value="today">Hôm nay</option>
                        <option value="week">Tuần này</option>
                        <option value="month">Tháng này</option>
                        <option value="year">Năm này</option>
                    </select>
                </div>

                {/* Status */}
                <div className="relative">
                    <Book className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                        value={filters.status}
                        onChange={(e) => handleStatusChange(e.target.value as FilterOptions['status'])}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="ongoing">Đang tiến hành</option>
                        <option value="completed">Hoàn thành</option>
                        <option value="hiatus">Tạm dừng</option>
                    </select>
                </div>
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="flex flex-wrap gap-2">
                        {filters.search && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600/20 text-blue-300 rounded-full text-sm">
                                Tìm kiếm: "{filters.search}"
                                <button
                                    onClick={() => handleSearchChange('')}
                                    className="hover:text-blue-200"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        )}

                        {filters.dateRange !== 'all' && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-600/20 text-green-300 rounded-full text-sm">
                                {filters.dateRange === 'today' && 'Hôm nay'}
                                {filters.dateRange === 'week' && 'Tuần này'}
                                {filters.dateRange === 'month' && 'Tháng này'}
                                {filters.dateRange === 'year' && 'Năm này'}
                                <button
                                    onClick={() => handleDateRangeChange('all')}
                                    className="hover:text-green-200"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        )}

                        {filters.status !== 'all' && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-600/20 text-purple-300 rounded-full text-sm">
                                {filters.status === 'ongoing' && 'Đang tiến hành'}
                                {filters.status === 'completed' && 'Hoàn thành'}
                                {filters.status === 'hiatus' && 'Tạm dừng'}
                                <button
                                    onClick={() => handleStatusChange('all')}
                                    className="hover:text-purple-200"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        )}

                        {(filters.sortBy !== 'lastRead' || filters.sortOrder !== 'desc') && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-600/20 text-yellow-300 rounded-full text-sm">
                                Sắp xếp: {filters.sortBy === 'title' ? 'Tên truyện' : 'Thời gian đọc'}
                                {filters.sortOrder === 'asc' ? ' ↑' : ' ↓'}
                                <button
                                    onClick={() => handleSortChange('lastRead', 'desc')}
                                    className="hover:text-yellow-200"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default HistoryFilter;