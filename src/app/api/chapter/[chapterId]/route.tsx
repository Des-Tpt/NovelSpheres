import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Chapter } from '@/model/Chapter';
import { Act } from '@/model/Act';

export async function GET(request: NextRequest, context: { params: Promise<{ chapterId: string }> }) {
    try {
        const { chapterId: chapterId } = await context.params;

        if (!chapterId) {
            return NextResponse.json({ error: 'Không tìm thấy chương!' }, { status: 400 });
        }

        await connectDB();

        // Lấy chapter - bao gồm luôn novel và act info thông qua populate
        const chapter = (await Chapter.findById(chapterId)
            .populate('novelId', '_id title')
            .populate('actId', '_id actNumber actType title')
            .lean()) as any;

        if (!chapter) {
            return NextResponse.json({ error: 'Chương không tồn tại!' }, { status: 404 });
        }

        const novel = chapter.novelId;
        const act = chapter.actId;
        const novelId = novel._id;

        // Lấy acts đã sắp xếp (bao gồm _id và actNumber)
        const acts = await Act.find({ novelId })
            .select('_id actNumber title actType')
            .sort({ actNumber: 1 })
            .lean();

        const allChapters = await Chapter.find({ 
            novelId: novelId,
            actId: { $in: acts.map(a => a._id) }
        })
            .select('_id chapterNumber title actId')
            .sort({ actId: 1, chapterNumber: 1 })
            .lean();

        // Định nghĩa type cho chaptersByAct
        interface ChapterInfo {
            _id: string;
            chapterNumber: number;
            title: string;
        }
        
        // Tạo object để group chapters theo actId
        const chaptersByAct: Record<string, ChapterInfo[]> = {};
        allChapters.forEach((chapter: any) => {
            const actId = String(chapter.actId);
            if (!chaptersByAct[actId]) {
                chaptersByAct[actId] = [];
            }
            chaptersByAct[actId].push({
                _id: String(chapter._id),
                chapterNumber: chapter.chapterNumber,
                title: chapter.title
            });
        });

        // Tạo structure cho acts với chapters
        const actsWithChapters = acts.map(actItem => ({
            _id: String(actItem._id),
            actNumber: actItem.actNumber,
            title: actItem.title,
            actType: actItem.actType,
            chapters: chaptersByAct[String(actItem._id)] || []
        }));

        // Lấy chapters của act hiện tại (để tính navigation trong act)
        const chaptersInCurrentAct = chaptersByAct[String(act._id)] || [];

        let prevChapter: any = null;
        let nextChapter: any = null;

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
            novel: {
                _id: String(novel._id),
                title: novel.title,
            },
            act: {
                _id: String(act._id),
                actNumber: Number(act.actNumber),
                actType: act.actType ?? null,
                title: act.title ?? null,
            },
            chapter: {
                _id: String(chapter._id),
                title: chapter.title,
                content: chapter.content,
                chapterNumber: Number(chapter.chapterNumber),
                wordCount: chapter.wordCount ?? null,
                createdAt: chapter.createdAt,
                updatedAt: chapter.updatedAt,
            },
            navigation: {
                prevChapter,
                nextChapter,
                hasNext: nextChapter !== null,
                hasPrev: prevChapter !== null
            },
            acts: actsWithChapters, 
            chaptersInAct: chaptersInCurrentAct,
        }, { status: 200 });
    } catch (err) {
        console.error('GET chapter error:', err);
        return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
    }
}