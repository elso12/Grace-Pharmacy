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
