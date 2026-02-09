import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Chapter } from '@/model/Chapter';
import { Act } from '@/model/Act';
import { History } from '@/model/History';

export async function GET(request: NextRequest, context: { params: Promise<{ chapterId: string }> }) {
    try {
        const { chapterId: chapterId } = await context.params;
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId' as string);

        if (!chapterId) {
            return NextResponse.json({ error: 'Không tìm thấy chương!' }, { status: 400 });
        }

        await connectDB();

        const chapter = (await Chapter.findById(chapterId)
            .populate('novelId', '_id title')
            .populate('actId', '_id actNumber actType title')
            .lean()) as any;

        if (!chapter) {
            return NextResponse.json({ error: 'Chương không tồn tại!' }, { status: 404 });
        }

        let lastUpdateTime = 0;
        const UPDATE_INTERVAL = 5000; // 5 giây

        if (chapter && userId && userId !== '') {
            const now = Date.now();

            if (now - lastUpdateTime >= UPDATE_INTERVAL) {
                lastUpdateTime = now;

                await History.findOneAndUpdate(
                    { userId, novelId: chapter.novelId._id, chapterId: chapter._id },
                    { $set: { lastReadAt: new Date() } },
                    { upsert: true }
                );
            }
        }

        const novel = chapter.novelId;
        const act = chapter.actId;
        const novelId = novel._id;

        // Lấy tất cả acts của novel.
        const acts = await Act.find({ novelId })
            .select('_id actNumber title actType')
            .sort({ actNumber: 1 })
            .lean();

        // Lấy toàn bộ chapter trong mỗi acts.
        const allChapters = await Chapter.find({
            novelId: novelId,
            actId: { $in: acts.map(a => a._id) }
        })
            .select('_id chapterNumber title actId')
            .sort({ actId: 1, chapterNumber: 1 })
            .lean();

        interface ChapterInfo {
            _id: string;
            chapterNumber: number;
            title: string;
        }

        // Group chapter lại theo act, mỗi act sẽ chứa các chapter thuộc về actId đó.
        const chaptersByAct: Record<string, ChapterInfo[]> = {};

        allChapters.forEach((chapter: any) => {
            const actId = String(chapter.actId);
            // Nếu trong chaptersByAct chưa có actId đó, thì tạo mới.
            if (!chaptersByAct[actId]) {
                chaptersByAct[actId] = [];
            }
            // Sau đó, push chapter vào chaptersByAct dựa theo actId. Ví dụ nếu chapterByAct[1] tồn tại, thì mọi chapter có actId = 1 sẽ được pushs vào chapterByAct[1].
            chaptersByAct[actId].push({
                _id: String(chapter._id),
                chapterNumber: chapter.chapterNumber,
                title: chapter.title
            });
        });

        // Tạo mảng actsWithChapter, lưu trữ toàn bộ dữ liệu của acts kèm theo 1 array chứa các chapter thuộc về act đó.
        const actsWithChapters = acts.map(actItem => ({
            _id: String(actItem._id),
            actNumber: actItem.actNumber,
            title: actItem.title,
            actType: actItem.actType,
            //Vì lúc đầu lưu chaptersByAct dựa vào actId, nên chỉ cần gán vào dựa theo actId.
            chapters: chaptersByAct[String(actItem._id)] || []
        }));

        // Lấy mảng chapters trong act hiện tại (Dùng để navigation khi chuyển qua act mới.)
        const chaptersInCurrentAct = chaptersByAct[String(act._id)] || [];

        let prevChapter: any = null;
        let nextChapter: any = null;

        // Tìm vị trí của chapter hiện tại dựa theo trường chapterNumber của chapter (chapter là biến chứa thông tin của chapter hiện tại, đã findbyId bằng _id).
        const currentChapterIndex = chaptersInCurrentAct.findIndex((c: ChapterInfo) => c.chapterNumber === chapter.chapterNumber);

        // Tìm NEXT chapter
        if (currentChapterIndex < chaptersInCurrentAct.length - 1) {
            // Next chapter trong cùng act
            const nextChapterInAct = chaptersInCurrentAct[currentChapterIndex + 1];
            nextChapter = {
                chapterId: nextChapterInAct._id,
                actId: String(act._id),
                actNumber: Number(act.actNumber),
                chapterNumber: nextChapterInAct.chapterNumber
            };
        } else {
            // Hết chapters trong act -> tìm act tiếp theo
            const currentActIndex = acts.findIndex(a => String(a._id) === String(act._id));
            if (currentActIndex < acts.length - 1) {
                const nextAct = acts[currentActIndex + 1];
                const chaptersInNextAct = chaptersByAct[String(nextAct._id)] || [];

                if (chaptersInNextAct.length > 0) {
                    const firstChapterInNextAct = chaptersInNextAct[0];
                    nextChapter = {
                        chapterId: firstChapterInNextAct._id,
                        actId: String(nextAct._id),
                        actNumber: nextAct.actNumber,
                        chapterNumber: firstChapterInNextAct.chapterNumber
                    };
                }
            }
        }

        // Tìm PREV chapter
        if (currentChapterIndex > 0) {
            // Prev chapter trong cùng act
            const prevChapterInAct = chaptersInCurrentAct[currentChapterIndex - 1];
            prevChapter = {
                chapterId: prevChapterInAct._id,
                actId: String(act._id),
                actNumber: Number(act.actNumber),
                chapterNumber: prevChapterInAct.chapterNumber
            };
        } else {
            // Đầu act -> tìm act trước đó
            const currentActIndex = acts.findIndex(a => String(a._id) === String(act._id));

            if (currentActIndex > 0) {
                const prevAct = acts[currentActIndex - 1];
                const chaptersInPrevAct = chaptersByAct[String(prevAct._id)] || [];

                if (chaptersInPrevAct.length > 0) {
                    const lastChapterInPrevAct = chaptersInPrevAct[chaptersInPrevAct.length - 1];
                    prevChapter = {
                        chapterId: lastChapterInPrevAct._id,
                        actId: String(prevAct._id),
                        actNumber: prevAct.actNumber,
                        chapterNumber: lastChapterInPrevAct.chapterNumber
                    };
                }
            }
        }

        // Trả dữ liệu về client
        return NextResponse.json({
            // Novel hiện tại
            novel: {
                _id: String(novel._id),
                title: novel.title,
            },
            // Act hiện tại
            act: {
                _id: String(act._id),
                actNumber: Number(act.actNumber),
                actType: act.actType ?? null,
                title: act.title ?? null,
            },
            // Chapter hiện tại
            chapter: {
                _id: String(chapter._id),
                title: chapter.title,
                content: chapter.content,
                chapterNumber: Number(chapter.chapterNumber),
                wordCount: chapter.wordCount ?? null,
                createdAt: chapter.createdAt,
                updatedAt: chapter.updatedAt,
            },
            // Chapter trước và chapter sau, chứa các thông tin cần thiết để navigation.
            navigation: {
                prevChapter,
                nextChapter,
                hasNext: nextChapter !== null,
                hasPrev: prevChapter !== null
            },
            // Mảng acts và mảng chapterInAct. Dùng để hiển thị sidebar.
            acts: actsWithChapters,
            chaptersInAct: chaptersInCurrentAct,
        }, { status: 200 });
    } catch (err) {
        return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
    }
}