import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { io, Socket } from 'socket.io-client';
import api from '../../services/api';
import { Search, Send, CheckCheck, Loader2, MessageSquare, ArrowLeft } from 'lucide-react';

interface Contact {
  _id: string;
  firstName: string;
  lastName: string;
  role: string;
  lastMessage: any;
  unreadCount: number;
}

interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  receiverId: string;
  receiverName: string;
  receiverRole: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

const getRoleColor = (role: string) => {
  switch (role) {
    case 'ADMIN': return 'bg-rose-100 text-rose-700';
    case 'PHARMACIST': return 'bg-emerald-100 text-emerald-700';
    case 'TECHNICIAN': return 'bg-blue-100 text-blue-700';
    case 'CASHIER': return 'bg-amber-100 text-amber-700';
    case 'CUSTOMER': return 'bg-purple-100 text-purple-700';
    default: return 'bg-slate-100 text-slate-700';
  }
};

const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [mobileShowSidebar, setMobileShowSidebar] = useState(true);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Initialize Socket.io and fetch contacts
  useEffect(() => {
    fetchContacts();

    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    socketRef.current = io(socketUrl, {
      withCredentials: true,
    });

    if (user?.id) {
      socketRef.current.emit('join_room', user.id);
    }

    socketRef.current.on('new_message', (msg: Message) => {
      // If we are currently chatting with the sender, append message and mark as read
      if (selectedContact && msg.senderId === selectedContact._id) {
        setMessages((prev) => [...prev, msg]);
        markThreadAsRead(msg.senderId);
      } else {
        // Otherwise, update unread badge in contacts list
        setContacts((prev) => 
          prev.map((c) => {
            if (c._id === msg.senderId) {
              return { ...c, unreadCount: c.unreadCount + 1, lastMessage: msg };
            }
            return c;
          }).sort((a, b) => {
            const dateA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
            const dateB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
            return dateB - dateA;
          })
        );
      }
    });

    // We also need to listen for the specific 'receive_message' emitted from controller
    socketRef.current.on('receive_message', (msg: Message) => {
      if (selectedContact && msg.senderId === selectedContact._id) {
        setMessages((prev) => [...prev, msg]);
        markThreadAsRead(msg.senderId);
      } else {
        fetchContacts(); // Easiest way to refresh if we don't manually stitch
      }
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [user, selectedContact]);

  const fetchContacts = async () => {
    try {
      const res = await api.get('/api/messages/contacts');
      // Sort contacts by latest message
      const sortedContacts = res.data.data.sort((a: Contact, b: Contact) => {
        const dateA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
        const dateB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      setContacts(sortedContacts);
    } catch (err) {
      console.error('Failed to fetch contacts', err);
    } finally {
      setLoadingContacts(false);
    }
  };

  const markThreadAsRead = async (otherUserId: string) => {
    try {
      await api.patch(`/api/messages/read/${otherUserId}`);
      setContacts((prev) =>
        prev.map((c) => (c._id === otherUserId ? { ...c, unreadCount: 0 } : c))
      );
    } catch (error) {
      console.error('Failed to mark as read', error);
    }
  };

  const handleSelectContact = async (contact: Contact) => {
    setSelectedContact(contact);
    setMobileShowSidebar(false);
    setLoadingMessages(true);
    try {
      const res = await api.get(`/api/messages/thread/${contact._id}`);
      setMessages(res.data.data);
      if (contact.unreadCount > 0) {
        markThreadAsRead(contact._id);
      }
    } catch (err) {
      console.error('Failed to fetch thread', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedContact) return;

    setSending(true);
    try {
      const res = await api.post('/api/messages/send', {
        receiverId: selectedContact._id,
        message: newMessage.trim(),
      });
      
      const sentMsg = res.data.data;
      setMessages((prev) => [...prev, sentMsg]);
      setNewMessage('');
      
      // Update contact's last message in local state
      setContacts((prev) => {
        const updated = prev.map((c) => 
          c._id === selectedContact._id ? { ...c, lastMessage: sentMsg } : c
        );
        return updated.sort((a, b) => {
          const dateA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
          const dateB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
          return dateB - dateA;
        });
      });
    } catch (err) {
      console.error('Failed to send message', err);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const filteredContacts = contacts.filter(
    (c) =>
      c.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-140px)] flex bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
      
      {/* ── Directory Sidebar ────────────────────────────────────────────── */}
      <div className={`w-full md:w-80 lg:w-96 flex flex-col border-r border-slate-200 bg-slate-50 transition-all ${!mobileShowSidebar && 'hidden md:flex'}`}>
        <div className="p-4 border-b border-slate-200 bg-white">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            Messages
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-100 border-transparent rounded-xl text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {loadingContacts ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center p-8 text-slate-500 text-sm">
              No contacts found.
            </div>
          ) : (
            filteredContacts.map((contact) => (
              <button
                key={contact._id}
                onClick={() => handleSelectContact(contact)}
                className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all ${
                  selectedContact?._id === contact._id
                    ? 'bg-blue-50 border border-blue-200 shadow-sm'
                    : 'hover:bg-slate-100 border border-transparent'
                }`}
              >
                <div className="relative shrink-0">
                  <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                    {contact.firstName[0]}{contact.lastName[0]}
                  </div>
                  {contact.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white">
                      {contact.unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {contact.firstName} {contact.lastName}
                    </p>
                  </div>
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold mb-1 ${getRoleColor(contact.role)}`}>
                    {contact.role}
                  </span>
                  <p className="text-xs text-slate-500 truncate">
                    {contact.lastMessage ? contact.lastMessage.message : 'No messages yet'}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── Active Chat Window ─────────────────────────────────────────── */}
      <div className={`flex-1 flex flex-col bg-white ${mobileShowSidebar && 'hidden md:flex'}`}>
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200 bg-white">
              <div className="flex items-center gap-3">
                <button
                  className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                  onClick={() => setMobileShowSidebar(true)}
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                  {selectedContact.firstName[0]}{selectedContact.lastName[0]}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 leading-tight">
                    {selectedContact.firstName} {selectedContact.lastName}
                  </h3>
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold mt-0.5 ${getRoleColor(selectedContact.role)}`}>
                    {selectedContact.role}
                  </span>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
              {loadingMessages ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <MessageSquare className="h-12 w-12 mb-3 opacity-20" />
                  <p>Send a message to start the conversation.</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.senderId === user?.id;
                  const showAvatar = !isMe && (idx === 0 || messages[idx - 1].senderId !== msg.senderId);

                  return (
                    <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      {!isMe && (
                        <div className="w-8 shrink-0 mr-2 flex flex-col justify-end">
                          {showAvatar && (
                            <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 mb-1">
                              {msg.senderName.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                      )}
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm ${
                        isMe 
                          ? 'bg-blue-600 text-white rounded-br-sm' 
                          : 'bg-white border border-slate-200 text-slate-900 rounded-bl-sm'
                      }`}>
                        {!isMe && showAvatar && (
                          <div className="text-[10px] font-bold text-slate-500 mb-1">
                            {msg.senderName}
                          </div>
                        )}
                        <p className="text-sm leading-relaxed break-words">{msg.message}</p>
                        <div className={`text-[10px] mt-1.5 flex items-center justify-end gap-1 ${isMe ? 'text-blue-200' : 'text-slate-400'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {isMe && (
                            <CheckCheck className={`h-3 w-3 ${msg.isRead ? 'text-blue-200' : 'opacity-50'}`} />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 bg-white border-t border-slate-200">
              <form onSubmit={handleSendMessage} className="flex gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={`Message ${selectedContact.firstName}...`}
                  className="flex-1 bg-slate-100 border-transparent rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="bg-blue-600 text-white rounded-xl px-5 flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
            <MessageSquare className="h-16 w-16 mb-4 opacity-20" />
            <h3 className="text-xl font-bold text-slate-700 mb-2">Your Messages</h3>
            <p>Select a contact from the sidebar to start chatting.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
