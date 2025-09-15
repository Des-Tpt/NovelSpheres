
# NovelSpheres 📚

NovelSpheres là nền tảng đọc và chia sẻ tiểu thuyết trực tuyến, cho phép người dùng đọc, viết và tương tác với cộng đồng yêu thích tiểu thuyết.

## 🌟 Tính năng chính

- **Đọc truyện**
  - Đọc tiểu thuyết với nhiều thể loại
  - Tùy chỉnh giao diện đọc (font chữ, kích thước, chế độ ban đêm)
  - Lưu tiến độ đọc và lịch sử

- **Viết truyện**
  - Tạo và quản lý tiểu thuyết
  - Tổ chức chương theo acts
  - Editor rich text cho nội dung
  
- **Tương tác cộng đồng**
  - Bình luận và thảo luận
  - Diễn đàn trao đổi
  - Đánh giá và xếp hạng
  - Thông báo realtime

## 🛠 Công nghệ sử dụng

- **Frontend:**
  - Next.js 13 (App Router)
  - TypeScript
  - TailwindCSS
  - Framer Motion
  - SWR

- **Backend:**
  - MongoDB
  - Cloudinary (lưu trữ ảnh)
  - Pusher (realtime notifications)

## 📦 Cài đặt

1. Clone repository:
```bash
git clone https://github.com/your-username/NovelSpheres.git
```

2. Cài đặt dependencies:
```bash
cd NovelSpheres
npm install
```

3. Tạo file .env.local và thêm các biến môi trường:
```env
MONGODB_URI=your_mongodb_uri
NEXT_PUBLIC_CLOUDINARY_NAME=your_cloudinary_name
NEXT_PUBLIC_CLOUDINARY_KEY=your_cloudinary_key
NEXT_PUBLIC_CLOUDINARY_SECRET=your_cloudinary_secret
PUSHER_APP_ID=your_pusher_app_id
NEXT_PUBLIC_PUSHER_KEY=your_pusher_key
PUSHER_SECRET=your_pusher_secret
```

4. Chạy development server:
```bash
npm run dev
```

## 📁 Cấu trúc thư mục

```
src/
├── action/      # API client actions
├── app/         # Next.js app router pages
├── components/  # React components
├── hooks/       # Custom React hooks
├── lib/         # Utility libraries
├── model/       # MongoDB models
├── service/     # Business logic services
├── store/       # Global state management
├── type/       # TypeScript types
└── utils/      # Helper functions
```

[MIT License](LICENSE)
