import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import User from '../models/user.model.js';
import Chat from '../models/chat.model.js';
import Message from '../models/message.model.js';
import onlineUsers from './onlineUsers.js'; // assumed to be a Map

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL, // e.g., http://localhost:5173
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  const userId = socket.handshake.auth?.userId;

  if (!userId) {
    console.warn('❌ Socket connection rejected: No userId');
    socket.disconnect();
    return;
  }

  socket.userId = userId;
  onlineUsers.set(userId, socket.id);

  io.emit('activeUsers', Array.from(onlineUsers.keys()));

  // ─────────────────────────────
  // ACTIVE USERS
  // ─────────────────────────────
  socket.on('getActiveUsers', () => {
    socket.emit('activeUsers', Array.from(onlineUsers.keys()));
  });

  socket.on('joinChat', (chatId) => {
    socket.join(chatId);
  });

  socket.on('leaveChat', (chatId) => {
    socket.leave(chatId);
  });

  // ─────────────────────────────
  // TYPING INDICATORS
  // ─────────────────────────────
  socket.on('typing', (chatId) => {
    socket.to(chatId).emit('typing', userId);
  });

  socket.on('stopTyping', (chatId) => {
    socket.to(chatId).emit('stopTyping', userId);
  });

  // ─────────────────────────────
  // READ RECEIPTS
  // ─────────────────────────────
  socket.on('messageRead', async ({ chatId, messageIds }) => {
    try {
      await Message.updateMany(
        { _id: { $in: messageIds }, chat: chatId },
        {
          $set: { status: 'read' },
          $addToSet: { seenBy: userId },
        }
      );
      socket.to(chatId).emit('messagesRead', { userId, messageIds });
    } catch (err) {
      console.error('❌ Failed to mark messages as read:', err);
    }
  });

  // ─────────────────────────────
  // NEW MESSAGE & DELIVERED STATUS
  // ─────────────────────────────
  socket.on('newMessage', async (message) => {
    try {
      let chatId = typeof message.chat === 'object'
        ? message.chat._id || message.chat.id
        : message.chat;

      const chat = await Chat.findById(chatId).populate('participants', '_id');
      if (!chat) {
        console.error('❌ Chat not found for message:', message);
        return;
      }

      const senderId = message.sender._id || message.sender;
      const recipientIds = chat.participants
        .map((u) => u._id.toString())
        .filter((id) => id !== senderId);

      // Emit newMessage to everyone except sender
      socket.to(chat._id.toString()).emit('newMessage', message);

      let delivered = false;

      for (const recipientId of recipientIds) {
        const recipientSocketId = onlineUsers.get(recipientId);
        if (recipientSocketId) {
          // mark as delivered
          await Message.findByIdAndUpdate(message._id, {
            status: 'delivered',
            $addToSet: { seenBy: recipientId },
          });

          delivered = true;
        }
      }

      // Notify sender only if delivered
      if (delivered) {
        const senderSocketId = onlineUsers.get(senderId);
        if (senderSocketId) {
          io.to(senderSocketId).emit('messagesDelivered', {
            userId: senderId,
            messageIds: [message._id],
          });
        }
      }
    } catch (err) {
      console.error('❌ Failed to auto-deliver message:', err);
    }
  });

  // ─────────────────────────────
  // MARK OLD MESSAGES AS DELIVERED
  // ─────────────────────────────
  socket.on('messagesDelivered', async ({ chatId }) => {
    try {
      await Message.updateMany(
        { chat: chatId, status: 'sent', sender: { $ne: userId } },
        { $set: { status: 'delivered' } }
      );

      const deliveredMessages = await Message.find({
        chat: chatId,
        status: 'delivered',
        sender: { $ne: userId },
      }).select('_id');

      const messageIds = deliveredMessages.map((m) => m._id.toString());

      // Notify sender (who is expecting ✓✓)
      socket.to(chatId).emit('messagesDelivered', {
        userId,
        messageIds,
      });
    } catch (err) {
      console.error('❌ Failed to mark messages as delivered:', err);
    }
  });

  // ─────────────────────────────
  // EDIT / DELETE
  // ─────────────────────────────
  socket.on('editMessage', (message) => {
    socket.to(message.chat).emit('editMessage', message);
  });

  socket.on('deleteMessage', (messageId, chatId) => {
    socket.to(chatId).emit('deleteMessage', messageId);
  });

  // ─────────────────────────────
  // DISCONNECT
  // ─────────────────────────────
  socket.on('disconnect', async () => {
    onlineUsers.delete(userId);
    io.emit('activeUsers', Array.from(onlineUsers.keys()));

    try {
      await User.findByIdAndUpdate(userId, { lastSeen: new Date() });
    } catch (err) {
      console.error('❌ Failed to update lastSeen:', err);
    }
  });
});

export { io, app, server };
