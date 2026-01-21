import WorkspaceDashboard from '@/components/workspace/WorkspaceDashboard';
import { redirect } from 'next/navigation';
import { getUserFromCookies } from '@/action/userAction';
import { getCurrentUser } from '@/lib/auth';

export const metadata = {
    title: 'Workspace - NovelSpheres',
    description: 'Manage your novels',
};

export default async function WorkspacePage() {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        redirect('/login');
    }

    return (
        <div className="min-h-screen bg-gray-950">
            <div className="w1080:px-[15%] px-4 pt-24 pb-10 max-w-[1920px] mx-auto">
                <WorkspaceDashboard currentUser={currentUser} />
            </div>
        </div>
    );
}
