import AdminUsersPage from '@/components/dashboard/users/AdminUsersPage';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Quản lý Người dùng - NovelSpheres Admin',
    description: 'Dashboard quản lý người dùng',
};

export default function UsersPage() {
    return <AdminUsersPage />;
}
