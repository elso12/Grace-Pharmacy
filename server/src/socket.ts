import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: SocketServer;

export const initSocketServer = (server: HttpServer) => {
  io = new SocketServer(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (
          origin.endsWith('.vercel.app') ||
          origin.includes('localhost') ||
          origin === process.env.CLIENT_URL
        ) {
          return callback(null, true);
        }
        return callback(null, true); // Fallback allowing dynamic preview URLs
      },
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Join room based on user role or specific ID
    socket.on('join_room', (room: string) => {
      socket.join(room);
      console.log(`[Socket] ${socket.id} joined room: ${room}`);
    });

    // Handle incoming chat messages
    socket.on('chat_message', (data: { room: string, message: string, senderId: string }) => {
      // Broadcast to everyone in the room except sender
      socket.to(data.room).emit('new_message', data);
    });

    // Handle delivery tracking updates
    socket.on('update_location', (data: { orderId: string, lat: number, lng: number }) => {
      // Broadcast to customer tracking the order
      io.to(`order_${data.orderId}`).emit('location_update', data);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

// ─── Notification Emitters ──────────────────────────────────────────────────
// Call these from controllers or services to push real-time notifications.

/**
 * Emit a low stock alert to all connected admin/staff clients
 */
export const emitLowStockAlert = (data: {
  productName: string;
  currentStock: number;
  reorderLevel: number;
}) => {
  try {
    const socket = getIO();
    socket.emit('low_stock_alert', data);
    socket.emit('notification_push', {
      title: 'Low Stock Alert',
      message: `${data.productName} is below reorder level (${data.currentStock} remaining)`,
      type: 'low_stock',
    });
  } catch {
    // Socket not initialized yet — skip silently during startup
  }
};

/**
 * Emit an expiry warning to all connected admin/staff clients
 */
export const emitExpiryAlert = (data: {
  productName: string;
  batchNumber: string;
  daysUntilExpiry: number;
}) => {
  try {
    const socket = getIO();
    socket.emit('expiry_alert', data);
    socket.emit('notification_push', {
      title: 'Expiry Warning',
      message: `Batch ${data.batchNumber} of ${data.productName} expires in ${data.daysUntilExpiry} days`,
      type: 'expiring',
    });
  } catch {
    // Socket not initialized yet
  }
};

/**
 * Emit a new order notification to all connected staff clients
 */
export const emitNewOrder = (data: {
  orderId: string;
  customerName?: string;
  totalAmount: number;
}) => {
  try {
    const socket = getIO();
    socket.emit('new_order', data);
    socket.emit('notification_push', {
      title: 'New Order Received',
      message: `Order #${data.orderId?.slice(-6).toUpperCase()} — $${data.totalAmount.toFixed(2)}`,
      type: 'order',
    });
  } catch {
    // Socket not initialized yet
  }
};

/**
 * Emit a generic notification
 */
export const emitNotification = (title: string, message: string, type: string = 'general') => {
  try {
    const socket = getIO();
    socket.emit('notification_push', { title, message, type });
  } catch {
    // Socket not initialized yet
  }
};
