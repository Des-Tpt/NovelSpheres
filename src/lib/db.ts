import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
    throw new Error('⚠️ MONGODB_URI chưa được khai báo trong .env.local');
}
 
//Biến cached dùng để giữ kết nối với MongoDB, tránh connect quá nhiều lần.
let cached = (global as any).mongoose;

if (!cached) {
    cached = (global as any).mongoose = {conn: null, promise: null};
}

export async function connectDB(): Promise<void> {
    //Kiểm tra xem đã kết nối hay chưa? Rồi thì thôi, không cần kết nối lại.
    if (cached.conn) {return cached.conn};

    if (!cached.promise) {
        cached.promise = await mongoose.connect(MONGODB_URI, {
            bufferCommands:false,
        }).then(() => {
            console.log('✅ Đã kết nối tới MongoDB');
            return mongoose.connection;
        }) .catch((error) => {
            console.error('Không thể kết nối tới DB:', error);
            cached.promise = null; // Reset promise nếu lỗi
            throw error;
        });
    }
    
    cached.conn = await cached.promise;
    return cached.conn;
}

export async function disconnectDB(): Promise<void> {
    if (cached.conn) {
        await mongoose.disconnect();
        cached.conn = null;
        cached.promise = null;
        console.log('Đã ngắt kết nối MongoDB');
    }
}
