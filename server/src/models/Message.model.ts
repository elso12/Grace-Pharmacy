import mongoose, { Document, Schema } from 'mongoose';

export const getConversationId = (userA: string, userB: string): string => {
  return [userA.toString(), userB.toString()].sort().join('_');
};

export interface IMessage extends Document {
  conversationId: string;
  senderId: mongoose.Types.ObjectId;
  senderName: string;
  senderRole: string;
  receiverId: mongoose.Types.ObjectId;
  receiverName: string;
  receiverRole: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    conversationId: { type: String, required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    senderName: { type: String, required: true },
    senderRole: {
      type: String,
      enum: ['ADMIN', 'PHARMACIST', 'TECHNICIAN', 'CASHIER', 'CUSTOMER'],
      required: true,
    },
    receiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    receiverName: { type: String, required: true },
    receiverRole: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
  }
);

// Compound index: efficient "messages in conversation X, ordered by time" queries
messageSchema.index({ conversationId: 1, createdAt: 1 });

const Message = mongoose.model<IMessage>('Message', messageSchema);
export default Message;
