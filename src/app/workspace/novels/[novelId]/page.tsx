import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { Novel } from '@/model/Novel';
import NovelEditor from '@/components/workspace/NovelEditor';
import { connectDB } from '@/lib/db';

export const metadata = {
    title: 'Editor - NovelSpheres',
    description: 'Edit your novel',
};

export default async function WorkspaceNovelPage({ params }: { params: Promise<{ novelId: string }> }) {
    const { novelId } = await params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        redirect('/login');
    }

    await connectDB();
    const novel = await Novel.findById(novelId).select('title authorId');

    if (!novel) {
        redirect('/workspace');
    }

    // Verify ownership
    if (novel.authorId.toString() !== currentUser._id.toString()) {
        redirect('/workspace');
    }

    return (
        <div className="min-h-screen">
            <NovelEditor novelId={novelId} novelTitle={novel.title} />
        </div>
    );
}
