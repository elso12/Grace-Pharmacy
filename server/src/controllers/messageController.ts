import { Request, Response } from 'express';
import Message, { getConversationId } from '../models/Message.model';
import User from '../models/User.model';
import mongoose from 'mongoose';
import { getIO } from '../socket';

// GET /api/messages/contacts
export const getContacts = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user?._id;
    if (!currentUserId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    // We want to return a list of all users EXCEPT the current user.
    // In a real huge app, we might paginate or only return users we've chatted with.
    // Here we'll return all available users, grouped by role.
    const allUsers = await User.find({
      _id: { $ne: currentUserId },
      isActive: true, // Only show active users
    }).select('_id firstName lastName role email');

    // We also want to fetch the last message for each conversation
    // To do this efficiently, we can run an aggregation on the Message model
    // or just fetch latest messages where sender=curr OR receiver=curr
    const messages = await Message.find({
      $or: [{ senderId: currentUserId }, { receiverId: currentUserId }],
    }).sort({ createdAt: -1 });

    // Build a map of latest message per user
    const lastMessageMap: Record<string, any> = {};
    const unreadCountMap: Record<string, number> = {};

    messages.forEach((msg) => {
      const otherUserId = msg.senderId.toString() === currentUserId.toString()
        ? msg.receiverId.toString()
        : msg.senderId.toString();

      if (!lastMessageMap[otherUserId]) {
        lastMessageMap[otherUserId] = msg;
      }

      // Count unread incoming messages
      if (msg.receiverId.toString() === currentUserId.toString() && !msg.isRead) {
        unreadCountMap[otherUserId] = (unreadCountMap[otherUserId] || 0) + 1;
      }
    });

    const contacts = allUsers.map((u) => {
      const uId = u._id.toString();
      return {
        _id: uId,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        lastMessage: lastMessageMap[uId] || null,
        unreadCount: unreadCountMap[uId] || 0,
      };
    });

    res.status(200).json({ success: true, data: contacts });
  } catch (error: any) {
    console.error('getContacts error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch contacts' });
  }
};

// GET /api/messages/thread/:otherUserId
export const getThread = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user?._id;
    if (!currentUserId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }
    const { otherUserId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
      res.status(400).json({ success: false, message: 'Invalid user ID' });
      return;
    }

    const conversationId = getConversationId(currentUserId.toString(), otherUserId);

    const messages = await Message.find({ conversationId }).sort({ createdAt: 1 });

    res.status(200).json({ success: true, data: messages });
  } catch (error: any) {
    console.error('getThread error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch thread' });
  }
};

// POST /api/messages/send
export const sendMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user?._id;
    if (!currentUserId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }
    const { receiverId, message } = req.body;

    if (!receiverId || !message) {
      res.status(400).json({ success: false, message: 'Missing receiverId or message' });
      return;
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      res.status(404).json({ success: false, message: 'Receiver not found' });
      return;
    }

    const sender = await User.findById(currentUserId);
    if (!sender) {
      res.status(404).json({ success: false, message: 'Sender not found' });
      return;
    }

    const conversationId = getConversationId(currentUserId.toString(), receiverId.toString());

    const newMessage = await Message.create({
      conversationId,
      senderId: sender._id,
      senderName: `${sender.firstName} ${sender.lastName}`,
      senderRole: sender.role,
      receiverId: receiver._id,
      receiverName: `${receiver.firstName} ${receiver.lastName}`,
      receiverRole: receiver.role,
      message,
    });

    // Emit socket event to the receiver's private room
    const io = getIO();
    io.to(receiver._id.toString()).emit('receive_message', newMessage);

    res.status(201).json({ success: true, data: newMessage });
  } catch (error: any) {
    console.error('sendMessage error:', error);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
};

// PATCH /api/messages/read/:otherUserId
export const markAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user?._id;
    if (!currentUserId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }
    const { otherUserId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
      res.status(400).json({ success: false, message: 'Invalid user ID' });
      return;
    }

    const conversationId = getConversationId(currentUserId.toString(), otherUserId);

    // Mark all incoming messages from this other user in this thread as read
    await Message.updateMany(
      { conversationId, receiverId: currentUserId, isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json({ success: true, message: 'Messages marked as read' });
  } catch (error: any) {
    console.error('markAsRead error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark as read' });
  }
};
