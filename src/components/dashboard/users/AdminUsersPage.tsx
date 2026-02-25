'use client';

import CustomImage from "@/components/ui/CustomImage";
import ConfirmModal from "@/components/ui/ConfirmModal";
import EditUserModal from "@/components/dashboard/users/EditUserModal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Info, Search, Users, Trash2, Eye, Edit, Unlock, UserX } from "lucide-react";
import { useState } from "react";

interface User {
    _id: string;
    username: string;
    email: string;
    role: string;
    profile?: {
        profileId?: string;
        avatar?: {
            publicId: string;
            format: string;
        };
    };
    createdAt: Date;
    isDeleted: boolean;
}

const cloudname = process.env.NEXT_PUBLIC_CLOUDINARY_NAME! as string;
const defaultFallback = `https://res.cloudinary.com/${cloudname}/image/upload/LightNovel/BookCover/96776418_p0_qov0r8.png`;

const AdminUserPage = () => {
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [search, setSearch] = useState("");

    // Modal states
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);

    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [confirmAction, setConfirmAction] = useState<{ type: 'delete' | 'restore' | 'view_profile', title: string, desc: string, btnText: string, variant: 'danger' | 'warning' | 'primary' }>({
        type: 'delete', title: '', desc: '', btnText: '', variant: 'danger'
    });

    const queryClient = useQueryClient();
    const router = useRouter();

    // Edit & Mutate logic inside actionMutation
    const actionMutation = useMutation({
        mutationFn: async (payload: any) => {
            const res = await fetch('/api/dashboard/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.message);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setIsConfirmOpen(false);
            setIsEditOpen(false);
            setSelectedUser(null);
        }
    });

    const triggerBanConfirm = (user: User) => {
        setSelectedUser(user);
        if (user.isDeleted) {
            setConfirmAction({
                type: 'restore',
                title: 'Mở khóa tài khoản',
                desc: `Bạn có chắc chắn muốn mở khóa cho tài khoản "${user.username}"? Người dùng sẽ lấy lại toàn quyền truy cập.`,
                btnText: 'Mở khóa ngay',
                variant: 'warning'
            });
        } else {
            setConfirmAction({
                type: 'delete',
                title: 'Khóa tài khoản',
                desc: `Tài khoản "${user.username}" sẽ bị vô hiệu hóa. Người dùng không thể đăng nhập cho đến khi bạn mở khóa lại.`,
                btnText: 'Khóa tài khoản',
                variant: 'danger'
            });
        }
        setIsConfirmOpen(true);
    };

    const triggerViewProfileConfirm = (user: User) => {
        setSelectedUser(user);
        setConfirmAction({
            type: 'view_profile',
            title: 'Chuyển trang Hồ sơ',
            desc: `Hệ thống sẽ chuyển bạn đến trang Hồ sơ cá nhân của người dùng "${user.username}". Tiếp tục?`,
            btnText: 'Tới trang Hồ sơ',
            variant: 'primary'
        });
        setIsConfirmOpen(true);
    };

    const handleConfirm = () => {
        if (!selectedUser) return;

        if (confirmAction.type === 'view_profile') {
            setIsConfirmOpen(false);
            router.push(`/profile/${selectedUser.profile?.profileId || selectedUser._id}`);
            return;
        }

        actionMutation.mutate({ userId: selectedUser._id, action: confirmAction.type });
    };

    const handleSaveEdit = (editedData: any) => {
        if (!selectedUser) return;
        actionMutation.mutate({ userId: selectedUser._id, ...editedData });
    };

    const { data, isPending, isError, error } = useQuery({
        queryKey: ['users', page, limit, search],
        queryFn: async () => {
            const res = await fetch(`/api/dashboard/users?page=${page}&limit=${limit}&search=${search}`);
            return res.json();
        },
        placeholderData: (previousData) => previousData,
    });


    if (isPending) {
        return (
            <div className="w-full flex-col min-h-[50vh] flex items-center justify-center p-8 bg-white rounded-2xl border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
                <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                <div className="text-gray-500 animate-pulse font-medium">Đang tải danh sách người dùng...</div>
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

    const { data: users, pagination } = data;

    return (
        <div className="w-full animate-in fade-in duration-500">
            <div className="mb-6 p-6 bg-white rounded-2xl border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý người dùng</h1>
                    <p className="text-gray-500 mt-1 text-sm">Danh sách tài khoản và phân quyền trong hệ thống</p>
                </div>

                <div className="relative w-full sm:w-auto min-w-[300px]">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm Email hoặc Tên..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl bg-gray-50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-200"
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50/50 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                                <th className="py-4 px-6 w-16 text-center">STT</th>
                                <th className="py-4 px-6">Người dùng</th>
                                <th className="py-4 px-6">Email</th>
                                <th className="py-4 px-6">Phân quyền</th>
                                <th className="py-4 px-6">Ngày tham gia</th>
                                <th className="py-4 px-6 text-center">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {(users && users.length > 0) ? users.map((u: User, index: number) => (
                                <tr key={u._id} className="border-b border-gray-100 last:border-0 hover:bg-blue-50/30 transition-colors">
                                    <td className="py-4 px-6 text-center text-gray-500 font-medium">
                                        {((page - 1) * limit) + index + 1}
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200 group-hover:border-indigo-400 transition-colors">
                                                {(u.profile?.avatar?.publicId) ? (
                                                    <CustomImage
                                                        src={`https://res.cloudinary.com/${cloudname}/image/upload/${u.profile.avatar.publicId}.${u.profile.avatar.format}`}
                                                        alt={u.username}
                                                        width={40} height={40}
                                                    />
                                                ) : (
                                                    <CustomImage
                                                        src={defaultFallback}
                                                        alt={u.username}
                                                        width={40} height={40}
                                                    />
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className={`font-semibold ${u.isDeleted ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                                    {u.username}
                                                </span>
                                                {u.isDeleted && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold w-fit">ĐÃ KHÓA</span>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-gray-600">
                                        {u.email}
                                    </td>
                                    <td className="py-4 px-6">
                                        {u.role === 'admin' && <span className="px-3 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-100">Admin</span>}
                                        {u.role === 'writer' && <span className="px-3 py-1 bg-green-50 text-green-600 text-xs font-bold rounded-lg border border-green-100">Tác giả</span>}
                                        {u.role === 'reader' && <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg border border-blue-100">Độc giả</span>}
                                    </td>
                                    <td className="py-4 px-6 text-gray-500">
                                        {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                                    </td>
                                    <td className="py-4 px-6 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => triggerViewProfileConfirm(u)}
                                                className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-colors border border-transparent hover:border-green-100"
                                                title="Tới trang Hồ sơ"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>

                                            <button
                                                onClick={() => { setSelectedUser(u); setIsEditOpen(true); }}
                                                className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                                                title="Chỉnh sửa"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>

                                            {u.isDeleted ? (
                                                <button
                                                    onClick={() => triggerBanConfirm(u)}
                                                    disabled={actionMutation.isPending}
                                                    className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors border border-transparent hover:border-amber-100"
                                                    title="Mở khóa tài khoản"
                                                >
                                                    <Unlock className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => triggerBanConfirm(u)}
                                                    disabled={actionMutation.isPending}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                                    title="Khóa tài khoản"
                                                >
                                                    <UserX className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-gray-500">
                                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        Không tìm thấy người dùng nào
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {pagination && pagination.totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
                        <span className="text-sm text-gray-500">
                            Trang {page} / {pagination.totalPages} (Tổng {pagination.totalElements} người dùng)
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
                title={confirmAction.title}
                description={confirmAction.desc}
                confirmText={confirmAction.btnText}
                variant={confirmAction.variant}
                isLoading={actionMutation.isPending}
            />

            {/* Edit Modal */}
            <EditUserModal
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                user={selectedUser}
                onSave={handleSaveEdit}
                isLoading={actionMutation.isPending}
            />
        </div>
    );
};

export default AdminUserPage;