import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<{ id: string; title: string; message: string; isRead: boolean }[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // In a real app, you'd fetch initial notifications from REST, then listen for new ones
    const socket: Socket = io((import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', ''), {
      transports: ['websocket'],
    });

    socket.on('notification_push', (data: any) => {
      setNotifications(prev => [{
        id: Date.now().toString(),
        title: data.title,
        message: data.message,
        isRead: false
      }, ...prev]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors focus:outline-none"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 text-[9px] font-bold text-white items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden transform origin-top-right transition-all">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
              <h3 className="font-semibold text-slate-800">Notifications</h3>
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">
                  Mark all as read
                </button>
              )}
            </div>
            
            <div className="max-h-[320px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-slate-500 text-sm flex flex-col items-center">
                  <Bell className="opacity-20 mb-2" size={24} />
                  No new notifications
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {notifications.map((notif) => (
                    <li key={notif.id} className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer ${!notif.isRead ? 'bg-emerald-50/30' : ''}`}>
                      <div className="flex gap-3">
                        {!notif.isRead && <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />}
                        <div>
                          <p className={`text-sm ${!notif.isRead ? 'font-semibold text-slate-800' : 'font-medium text-slate-700'}`}>
                            {notif.title}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{notif.message}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
