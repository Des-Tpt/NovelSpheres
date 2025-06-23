import { Schema, Document, models, model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IChapter extends Document {
    _id: Schema.Types.ObjectId,
    novelId: Schema.Types.ObjectId,
    actId: Schema.Types.ObjectId,
    title: String,
    content: String,
    chapterNumber: Number,
    wordCount: Number,
    updatedAt: Date,
    createdAt: Date
}

const ChapterSchema = new Schema<IChapter>({
    _id: { type: Schema.Types.ObjectId, auto: true },
    novelId: { type: Schema.Types.ObjectId, ref: 'Novel', required: true },
    actId: { type: Schema.Types.ObjectId, ref: 'Act', required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    chapterNumber: { type: Number, required: true },
    wordCount: Number,
    updatedAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
})

ChapterSchema.index({ novelId: 1, chapterNumber: 1 });
ChapterSchema.index({ actId: 1 });

ChapterSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
  });
  

export const Chapter = models.Chapter || model<IChapter>('Chapter', ChapterSchema, 'Chapter');

// {"_id":{"$oid":"685428779d7a6a08b4f99743"},"title":"Huyền Thoại Dưới Ánh Trăng Mờ","authorId":{"$oid":"685624b69cbcfafda4131671"},"createdAt":{"$date":{"$numberLong":"1713891600000"}},"description":"Một câu chuyện giả tưởng về hành trình của một hiệp sĩ trẻ trong thế giới phép thuật.","rating":{"$numberDecimal":"4.5"},"status":"ongoing","updatedAt":{"$date":{"$numberLong":"1719248400000"}},"view":{"$numberDecimal":"1500"},"coverImage":{"publicId":"LightNovel/BookCover/116699971_p0_pjyxtu","format":"jpg"},"genresId":[{"$oid":"685632912d00d2afd756f371"}]}