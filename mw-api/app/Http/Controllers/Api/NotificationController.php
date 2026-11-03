<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class NotificationController extends Controller
{
    /**
     * Get recent notifications and unread count
     */
    public function index(Request $request)
    {
        $limit = min((int) $request->input('limit', 30), 100);
        $type = $request->input('type');

        $query = Notification::query()->orderBy('created_at', 'desc');

        if ($type) {
            $query->where('type', $type);
        }

        $notifications = $query->limit($limit)->get();
        $unreadCount = Notification::where('is_read', false)->count();

        return response()->json([
            'success' => true,
            'unread_count' => $unreadCount,
            'data' => $notifications
        ]);
    }

    /**
     * Store and broadcast a new notification
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|string|max:50',
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'link' => 'nullable|string',
            'icon' => 'nullable|string',
            'meta' => 'nullable|array'
        ]);

        $notification = Notification::create([
            'type' => $validated['type'],
            'title' => $validated['title'],
            'message' => $validated['message'],
            'link' => $validated['link'] ?? null,
            'icon' => $validated['icon'] ?? null,
            'is_read' => false,
            'meta' => $validated['meta'] ?? []
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Notification created and broadcasted',
            'data' => $notification
        ], 201);
    }

    /**
     * Server-Sent Events (SSE) stream for real-time notifications
     */
    public function stream(Request $request)
    {
        $response = new StreamedResponse(function () use ($request) {
            // Initial connection event
            $unreadCount = Notification::where('is_read', false)->count();
            echo "event: connected\n";
            echo 'data: ' . json_encode(['status' => 'connected', 'time' => now()->toIso8601String(), 'unread_count' => $unreadCount]) . "\n\n";

            // Push latest unread notifications
            $latest = Notification::where('is_read', false)->orderBy('created_at', 'desc')->limit(5)->get();
            foreach ($latest as $item) {
                echo "event: notification\n";
                echo 'data: ' . json_encode([
                    'notification' => $item,
                    'unread_count' => $unreadCount
                ]) . "\n\n";
            }

            if (ob_get_level() > 0) ob_flush();
            flush();
        });

        $response->headers->set('Content-Type', 'text/event-stream');
        $response->headers->set('Cache-Control', 'no-cache, no-store, must-revalidate');
        $response->headers->set('Connection', 'close');
        $response->headers->set('X-Accel-Buffering', 'no');

        return $response;
    }

    /**
     * Mark a single notification as read
     */
    public function markRead($id)
    {
        $notification = Notification::find($id);
        if (!$notification) {
            return response()->json(['success' => false, 'message' => 'Notification not found'], 404);
        }

        $notification->update(['is_read' => true]);
        $unreadCount = Notification::where('is_read', false)->count();

        return response()->json([
            'success' => true,
            'unread_count' => $unreadCount,
            'data' => $notification
        ]);
    }

    /**
     * Mark all notifications as read
     */
    public function markAllRead()
    {
        Notification::where('is_read', false)->update(['is_read' => true]);

        return response()->json([
            'success' => true,
            'message' => 'All notifications marked as read',
            'unread_count' => 0
        ]);
    }

    /**
     * Delete a notification
     */
    public function destroy($id)
    {
        $notification = Notification::find($id);
        if ($notification) {
            $notification->delete();
        }

        $unreadCount = Notification::where('is_read', false)->count();

        return response()->json([
            'success' => true,
            'message' => 'Notification deleted',
            'unread_count' => $unreadCount
        ]);
    }

    /**
     * Clear all read notifications
     */
    public function clearAll()
    {
        Notification::where('is_read', true)->delete();

        return response()->json([
            'success' => true,
            'message' => 'All read notifications cleared'
        ]);
    }
}
