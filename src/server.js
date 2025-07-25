import {app,server,io} from './utils/socket.js'; // ✅ import from utils/socket.js
import express from 'express';
import dotenv from 'dotenv'
dotenv.config();

import cookieParser from 'cookie-parser'; // ✅ correct import

import authRoutes from './routes/auth.routes.js';
import chatUserRoutes from './routes/user.routes.js'
import messageRoutes from './routes/message.routes.js'
import friendsRoutes from './routes/friends.routes.js';
import connectDB from './db/db.js';
import cors from 'cors'
const PORT = process.env.PORT || 3000;


app.use(cors({
  origin: process.env.CLIENT_URL, // ✅ use environment variable for client URL
  credentials: true
}));

app.use(express.json());
app.use(cookieParser()); // ✅ use cookie-parser middleware

app.use('/api/auth', authRoutes);
app.use('/api/chat',chatUserRoutes);
app.use('/api/message',messageRoutes);
app.use('/api/friends',friendsRoutes);


server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  connectDB();
});
