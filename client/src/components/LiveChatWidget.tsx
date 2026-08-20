import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Paperclip } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

const LiveChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ id: string; text: string; sender: 'user' | 'pharmacist'; time: string }[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Connect to WebSocket server when widget opens
    if (isOpen && !socketRef.current) {
      socketRef.current = io((import.meta.env.VITE_API_URL || 'https://grace-pharmacy.onrender.com/api').replace('/api', ''), {
        withCredentials: true
      });

      socketRef.current.on('connect', () => {
        setIsConnected(true);
        // Simulate joining a unique consultation room
        socketRef.current?.emit('join_room', 'consultation_room_123');
      });

      socketRef.current.on('new_message', (data: any) => {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          text: data.message,
          sender: 'pharmacist',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      });

      socketRef.current.on('disconnect', () => {
        setIsConnected(false);
      });
    }

    return () => {
      if (socketRef.current && !isOpen) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
    };
  }, [isOpen]);

  useEffect(() => {
    // Auto-scroll to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const newMessage = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user' as const,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');

    // Emit to backend
    socketRef.current?.emit('chat_message', {
      room: 'consultation_room_123',
      message: newMessage.text,
      senderId: 'user_123'
    });
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-2xl transition-all z-50 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100 bg-emerald-600 hover:bg-emerald-700 text-white hover:scale-105'}`}
      >
        <MessageSquare size={24} />
      </button>

      {/* Chat Window */}
      <div
        className={`fixed bottom-6 right-6 w-80 sm:w-96 h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col transition-all origin-bottom-right z-50 border border-slate-200 overflow-hidden ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}
      >
        {/* Header */}
        <div className="bg-emerald-600 p-4 flex items-center justify-between text-white shrink-0">
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              Live Pharmacist
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-300 animate-pulse' : 'bg-slate-300'}`} />
            </h3>
            <p className="text-emerald-100 text-xs mt-0.5">We typically reply in a few minutes.</p>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-emerald-700 rounded-md transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Message Area */}
        <div className="flex-1 p-4 overflow-y-auto bg-slate-50 flex flex-col gap-3">
          {messages.length === 0 && (
            <div className="text-center text-slate-500 text-sm mt-10">
              <MessageSquare className="mx-auto mb-2 opacity-20" size={32} />
              Start a consultation...
            </div>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col max-w-[80%] ${msg.sender === 'user' ? 'self-end items-end' : 'self-start items-start'}`}>
              <div className={`px-4 py-2 rounded-2xl text-sm shadow-sm ${msg.sender === 'user' ? 'bg-emerald-600 text-white rounded-br-sm' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-sm'}`}>
                {msg.text}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.time}</span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={sendMessage} className="p-3 bg-white border-t border-slate-100 flex items-center gap-2 shrink-0">
          <button type="button" className="p-2 text-slate-400 hover:text-emerald-600 transition-colors rounded-full hover:bg-emerald-50">
            <Paperclip size={20} />
          </button>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-slate-100 border-transparent rounded-full px-4 py-2 text-sm focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="p-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-600 transition-colors shadow-md shadow-emerald-200"
          >
            <Send size={18} className="ml-0.5" />
          </button>
        </form>
      </div>
    </>
  );
};

export default LiveChatWidget;
