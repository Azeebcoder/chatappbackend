import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import User from '../models/user.model.js'
import onlineUsers from './onlineUsers.js';
import Message from '../models/message.model.js'
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL, // e.g. http://localhost:5173
    methods: ['GET', 'POST'],
    credentials: true,
  },
});



io.on('connection', (socket) => {
  const userId = socket.handshake.auth?.userId;

  if (!userId) {
    console.warn('Socket connection rejected: No userId');
    socket.disconnect();
    return;
  }

  socket.userId = userId;
  onlineUsers.set(userId, socket.id);

  // Emit updated online user list
  io.emit('activeUsers', Array.from(onlineUsers.keys()));

  // Join/leave chat rooms
  socket.on('joinChat', (chatId) => {
    socket.join(chatId);
  });

  socket.on('leaveChat', (chatId) => {
    socket.leave(chatId);
  });

  // Typing indicator
  socket.on('typing', (chatId) => {
    socket.to(chatId).emit('typing', userId);
  });

  socket.on('stopTyping', (chatId) => {
    socket.to(chatId).emit('stopTyping', userId);
  }); 


  //read recipt 
  socket.on('messageRead', async ({ chatId, messageIds }) => {
    try {
      // Update DB (set messages as read)
      await Message.updateMany(
        { _id: { $in: messageIds }, chat: chatId },
        { $set: { read: true } }
      );
      // Notify other users
      socket.to(chatId).emit('messagesRead', { userId, messageIds });
    } catch (err) {
      console.error('Failed to mark messages as read:', err);
    }
  });

  // Disconnect
  socket.on('disconnect', async () => {
    onlineUsers.delete(userId);
    io.emit('activeUsers', Array.from(onlineUsers.keys()));
    try {
      await User.findByIdAndUpdate(userId, { lastSeen: new Date() });
    } catch (err) {
      console.error('Failed to update lastSeen:', err);
    }
  });
});

export { io, app, server };
