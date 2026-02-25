'use client';

import ConfirmModal from "@/components/ui/ConfirmModal";
import EditGenreModal from "@/components/dashboard/genres/EditGenreModal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Info, Search, Tags, Trash2, Edit, Plus } from "lucide-react";
import { useState } from "react";

interface Genre {
    _id: string;
    name: string;
    description: string;
}

const AdminGenresPage = () => {
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [search, setSearch] = useState("");

    // Modal states
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);

    const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null);

    const queryClient = useQueryClient();

    // Edit & Mutate logic
    const actionMutation = useMutation({
        mutationFn: async (payload: any) => {
            const res = await fetch('/api/dashboard/genres', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.message);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['genres'] });
            setIsConfirmOpen(false);
            setIsEditOpen(false);
            setSelectedGenre(null);
        }
    });

    const triggerDeleteConfirm = (genre: Genre) => {
        setSelectedGenre(genre);
        setIsConfirmOpen(true);
    };

    const handleConfirm = () => {
        if (!selectedGenre) return;
        actionMutation.mutate({ genreId: selectedGenre._id, action: 'delete' });
    };

    const handleSaveEdit = (editedData: any) => {
        if (selectedGenre) {
            actionMutation.mutate({ genreId: selectedGenre._id, ...editedData });
        } else {
            actionMutation.mutate(editedData); // Create
        }
    };

    const { data, isPending, isError, error } = useQuery({
        queryKey: ['genres', page, limit, search],
        queryFn: async () => {
            const res = await fetch(`/api/dashboard/genres?page=${page}&limit=${limit}&search=${search}`);
            return res.json();
        },
        placeholderData: (previousData) => previousData,
    });

    if (isPending) {
        return (
            <div className="w-full flex-col min-h-[50vh] flex items-center justify-center p-8 bg-white rounded-2xl border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
                <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                <div className="text-gray-500 animate-pulse font-medium">Đang tải danh sách thể loại...</div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="w-full p-8 bg-red-50 border border-red-100 rounded-2xl flex flex-col items-center justify-center shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
                <Info className="w-12 h-12 text-red-500 mb-3" />
                <h3 className="text-lg font-bold text-red-700">Lỗi kết nối dữ liệu</h3>
                <p className="text-red-500 mt-1 max-w-md text-center text-sm">{error?.message || "Không thể tải dữ liệu!"}</p>
            </div>
        );
    }

    const { data: genres, pagination } = data;

    return (
        <div className="w-full animate-in fade-in duration-500">
            <div className="mb-6 p-6 bg-white rounded-2xl border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý thể loại</h1>
                    <p className="text-gray-500 mt-1 text-sm">Danh sách các chuyên mục và thể loại phân loại nội dung.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto min-w-[300px]">
                    <div className="relative flex-1">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm thể loại..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl bg-gray-50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-200"
                        />
                    </div>

                    <button
                        onClick={() => { setSelectedGenre(null); setIsEditOpen(true); }}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-sm focus:ring-4 focus:ring-blue-500/20 outline-none whitespace-nowrap"
                    >
                        <Plus className="w-5 h-5" /> Thêm mới
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50/50 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                                <th className="py-4 px-6 w-16 text-center">STT</th>
                                <th className="py-4 px-6 w-1/4">Tên thể loại</th>
                                <th className="py-4 px-6">Mô tả</th>
                                <th className="py-4 px-6 text-center w-32">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {(genres && genres.length > 0) ? genres.map((g: Genre, index: number) => (
                                <tr key={g._id} className="border-b border-gray-100 last:border-0 hover:bg-blue-50/30 transition-colors">
                                    <td className="py-4 px-6 text-center text-gray-500 font-medium">
                                        {((page - 1) * limit) + index + 1}
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0 border border-orange-100/50">
                                                <Tags className="w-5 h-5 text-orange-500" />
                                            </div>
                                            <span className="font-semibold text-gray-900 text-base">{g.name}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-gray-600">
                                        <p className="line-clamp-2">{g.description}</p>
                                    </td>

                                    <td className="py-4 px-6 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => { setSelectedGenre(g); setIsEditOpen(true); }}
                                                className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                                                title="Chỉnh sửa"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>

                                            <button
                                                onClick={() => triggerDeleteConfirm(g)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                                title="Xóa thể loại"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="py-12 text-center text-gray-500">
                                        <Tags className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        Không tìm thấy thể loại nào
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {pagination && pagination.totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
                        <span className="text-sm text-gray-500">
                            Trang {page} / {pagination.totalPages} (Tổng {pagination.totalElements} thể loại)
                        </span>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
                            >
                                Trang trước
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                disabled={page === pagination.totalPages}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
                            >
                                Trang sau
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Reusable Confirm Popup */}
            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirm}
                title="Xóa Thể loại"
                description={`Bạn có chắc chắn muốn xóa thể loại "${selectedGenre?.name}"? Hệ thống sẽ mất dữ liệu phân loại của những truyện thuộc thể loại này.`}
                confirmText="Xác nhận xóa"
                variant="danger"
                isLoading={actionMutation.isPending}
            />

            {/* Edit/Create Modal */}
            <EditGenreModal
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                genre={selectedGenre}
                onSave={handleSaveEdit}
                isLoading={actionMutation.isPending}
            />
        </div>
    );
};

export default AdminGenresPage;
