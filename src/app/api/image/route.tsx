import { v2 as cloudinary } from 'cloudinary';
import formidable from 'formidable';
import { NextRequest, NextResponse } from 'next/server';
import { Novel } from '@/model/Novel';
import { connectDB } from '@/lib/db';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const uploadDir = path.join(process.cwd(), 'uploads'); //Tạo đường dẫn vào thư mục uploads, dùng để chứa file tạm.
    await fs.promises.mkdir(uploadDir, { recursive: true }); //Tạo thư mục uploads.

    const form = formidable({
      uploadDir,
      keepExtensions: true, 
      multiples: false,
      //Khởi tạo Formidable, dùng nó để trích xuất dữ liệu, lưu file tạm vào thư mục đã khai báo, tức /uploads.
    });

    //Xử lý form, ép kiểu kết quả thành any. Ba biến err, fields và files dùng để lưu trữ lỗi, các trường dữ liệu trong form, và đường dẫn thư mục trong form.
    const [fields, files] = await new Promise<any[]>((resolve, reject) => {
      form.parse(req as any, (err, fields, files) => {
        if (err) return reject(err);
        resolve([fields, files]);
      });
    });

    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!file || !file.filepath) {
      return NextResponse.json({ error: 'Không có file upload' }, { status: 400 });
    }
    console.log('📥 Đã nhận file:', file);
    

    const result = await cloudinary.uploader.upload(file.filepath, {
      folder: 'LightNovel/BookCover',
      upload_preset: 'LightNovel',
    });
    await fs.promises.unlink(file.filepath);
    console.log('☁️ Đã upload lên Cloudinary:', result);
    
    
    let novel;

    try {
          await connectDB();

          novel = new Novel ({
            _id: uuidv4(),
            title: fields.title,
            authorId: fields.userId,
            description: fields.description,
            coverImage: {
              publicId: result.public_id,
              format: result.format,
            },
            genres:  Array.isArray(fields.genres) ? JSON.parse(fields.genres) : fields.genres,
            status: 'ongoing',
            views: 0,
            rating: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          }); 
          await novel.save();

    } catch (error){
      return NextResponse.json(
        { error: 'Lỗi khi lưu dữ liệu novel' },
        { status: 500 }
      );
    }

    return NextResponse.json({ novel, url: result.secure_url });
  } catch (error) {
    console.error('Lỗi khi upload:', error);
    return NextResponse.json({ error: 'Lỗi khi upload file' }, { status: 500 });
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
    const { searchParams } = new URL(req.url);
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const publicId = searchParams.get('publicId');
    const format = searchParams.get('format') || 'jpg';
    const allowedFormats = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

    if (!cloudName || !publicId) {
        return NextResponse.json({ error: 'Thiếu cloudName hoặc publicId' }, { status: 400 });
    }

    if (!allowedFormats.includes(format)) {
        return NextResponse.json({ error: 'Định dạng ảnh không hợp lệ' }, { status: 400 });
    }
    const url = `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}.${format}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Lỗi fetch ảnh');
        const blob = await response.blob();
        return new NextResponse(blob, {
        status: 200,
        headers: { 'Content-Type': `image/${format}` },
    });
    } catch (error) {
        return NextResponse.json({ error: 'Lỗi khi fetch ảnh' }, { status: 500 });
    }
}