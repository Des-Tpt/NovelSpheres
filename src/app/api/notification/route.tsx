import { connectDB } from "@/lib/db";
import { Notification } from "@/model/Notification";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    // Pagination params
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const skip = (page - 1) * limit;
    
    // Filter params
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    
    // Validation
    if (!userId) {
        return NextResponse.json({ error: 'Thiếu userId' }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return NextResponse.json({ error: 'userId không hợp lệ' }, { status: 400 });
    }

    try {
        await connectDB();

        // Build filter with proper interface
        interface NotificationFilter {
            userId: mongoose.Types.ObjectId;
            isRead?: boolean;
            type?: string;
        }
        
        const filter: NotificationFilter = { 
            userId: new mongoose.Types.ObjectId(userId) 
        };
        
        if (status === 'read') {
            filter.isRead = true;
        } else if (status === 'unread') {
            filter.isRead = false;
        }
        
        if (type) {
            filter.type = type;
        }

        // Parallel queries for better performance
        const [notifies, total, unreadCount] = await Promise.all([
            Notification.find(filter)
                .select('message type href isRead createdAt') // Only needed fields
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(), // Use lean() for better performance
            
            Notification.countDocuments(filter),
            
            // Get unread count for badge
            Notification.countDocuments({ 
                userId: new mongoose.Types.ObjectId(userId), 
                isRead: false 
            })
        ]);

        const response = NextResponse.json({
            success: true,
            data: notifies,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: skip + limit < total,
                hasPrev: page > 1
            },
            meta: {
                unreadCount
            }
        });

        // Add cache headers (5 minutes for read notifications, no cache for unread)
        if (status === 'read') {
            response.headers.set('Cache-Control', 'public, max-age=300');
        } else {
            response.headers.set('Cache-Control', 'no-cache, must-revalidate');
        }

        return response;

    } catch (error) {
        console.error('Notification fetch error:', error);
        return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
    }
}

// Thêm endpoint riêng để mark as read (PUT method)
export async function PUT(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const body = await req.json();
    const { notificationIds, markAllAsRead } = body;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return NextResponse.json({ error: 'userId không hợp lệ' }, { status: 400 });
    }

    try {
        await connectDB();

        let updateResult;

        if (markAllAsRead) {
            // Mark all notifications as read
            updateResult = await Notification.updateMany(
                { userId: new mongoose.Types.ObjectId(userId), isRead: false },
                { isRead: true }
            );
        } else if (notificationIds && Array.isArray(notificationIds)) {
            // Mark specific notifications as read
            updateResult = await Notification.updateMany(
                { 
                    _id: { $in: notificationIds.map(id => new mongoose.Types.ObjectId(id)) },
                    userId: new mongoose.Types.ObjectId(userId)
                },
                { isRead: true }
            );
        }

        return NextResponse.json({
            success: true,
            modifiedCount: updateResult?.modifiedCount || 0
        });

    } catch (error) {
        console.error('Mark as read error:', error);
        return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
    }
}