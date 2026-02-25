import AdminGenresPage from '@/components/dashboard/genres/AdminGenresPage';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Quản lý Thể loại',
    description: 'Bảng điều khiển quản lý thể loại trong hệ thống',
};

export default function DashboardGenres() {
    return <AdminGenresPage />;
}
