import React, { useState, useEffect, useRef } from 'react';
import { Bell, AlertTriangle, Package, ShoppingBag, MessageSquare, X } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'low_stock' | 'expiring' | 'order' | 'message' | 'general';
  isRead: boolean;
  createdAt: Date;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  low_stock: <Package size={14} className="text-amber-400" />,
  expiring:  <AlertTriangle size={14} className="text-rose-400" />,
  order:     <ShoppingBag size={14} className="text-blue-400" />,
  message:   <MessageSquare size={14} className="text-purple-400" />,
  general:   <Bell size={14} className="text-slate-400" />,
};

const TYPE_COLORS: Record<string, string> = {
  low_stock: 'border-l-amber-500',
  expiring:  'border-l-rose-500',
  order:     'border-l-blue-500',
  message:   'border-l-purple-500',
  general:   'border-l-slate-500',
};

const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const socket: Socket = io(
      (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', ''),
      { transports: ['websocket'] }
    );

    // Listen for notification events
    socket.on('notification_push', (data: any) => {
      setNotifications(prev => [{
        id: Date.now().toString(),
        title: data.title,
        message: data.message,
        type: (data.type || 'general') as Notification['type'],
        isRead: false,
        createdAt: new Date(),
      }, ...prev].slice(0, 50)); // Keep max 50
    });

    // Specific alert channels
    socket.on('low_stock_alert', (data: any) => {
      setNotifications(prev => [{
        id: Date.now().toString(),
        title: 'Low Stock Alert',
        message: `${data.productName} is below reorder level (${data.currentStock} remaining)`,
        type: 'low_stock' as const,
        isRead: false,
        createdAt: new Date(),
      }, ...prev].slice(0, 50));
    });

    socket.on('expiry_alert', (data: any) => {
      setNotifications(prev => [{
        id: Date.now().toString(),
        title: 'Expiry Warning',
        message: `Batch ${data.batchNumber} of ${data.productName} expires in ${data.daysUntilExpiry} days`,
        type: 'expiring' as const,
        isRead: false,
        createdAt: new Date(),
      }, ...prev].slice(0, 50));
    });

    socket.on('new_order', (data: any) => {
      setNotifications(prev => [{
        id: Date.now().toString(),
        title: 'New Order',
        message: `Order #${data.orderId?.slice(-6).toUpperCase()} received from ${data.customerName || 'a customer'}`,
        type: 'order' as const,
        isRead: false,
        createdAt: new Date(),
      }, ...prev].slice(0, 50));
    });

    socket.on('new_message', (data: any) => {
      setNotifications(prev => [{
        id: Date.now().toString(),
        title: 'New Message',
        message: data.message || 'You have a new message',
        type: 'message' as const,
        isRead: false,
        createdAt: new Date(),
      }, ...prev].slice(0, 50));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const timeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 focus:outline-none"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 flex h-4.5 w-4.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-[18px] w-[18px] bg-rose-500 text-[9px] font-bold text-white items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[360px] bg-slate-900 rounded-2xl shadow-2xl border border-white/[0.08] z-50 overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-bold rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="text-[11px] text-blue-400 hover:text-blue-300 font-medium transition-colors">
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button onClick={clearAll} className="p-1 text-slate-500 hover:text-slate-300 transition-colors" title="Clear all">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
          
          {/* Notification list */}
          <div className="max-h-[380px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-5 py-10 text-center flex flex-col items-center">
                <Bell className="text-slate-700 mb-3" size={28} />
                <p className="text-sm text-slate-500">No notifications yet</p>
                <p className="text-[10px] text-slate-600 mt-1">You'll see alerts for low stock, expiring batches, and new orders here.</p>
              </div>
            ) : (
              <ul>
                {notifications.map((notif) => (
                  <li
                    key={notif.id}
                    onClick={() => markAsRead(notif.id)}
                    className={`px-5 py-3.5 border-l-2 cursor-pointer transition-colors ${TYPE_COLORS[notif.type] || TYPE_COLORS.general} ${
                      !notif.isRead
                        ? 'bg-white/[0.02] hover:bg-white/[0.04]'
                        : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="mt-0.5 shrink-0">
                        {TYPE_ICONS[notif.type] || TYPE_ICONS.general}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm leading-snug ${
                            !notif.isRead ? 'font-semibold text-white' : 'font-medium text-slate-300'
                          }`}>
                            {notif.title}
                          </p>
                          {!notif.isRead && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
                          {notif.message}
                        </p>
                        <p className="text-[10px] text-slate-600 mt-1">
                          {timeAgo(notif.createdAt)}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
