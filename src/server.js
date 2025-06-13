import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

import cookieParser from 'cookie-parser'; // ✅ correct import

import authRoutes from './routes/auth.routes.js';
import chatUserRoutes from './routes/user.routes.js'
import messageRoutes from './routes/message.routes.js'
import friendsRoutes from './routes/friends.routes.js';
import connectDB from './db/db.js';
import cors from 'cors'


const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors({
  origin: "https://sumychat.netlify.app", // ✅ use environment variable for client URL
  credentials: true
}));

app.use(cookieParser()); // ✅ use cookie-parser middleware

app.use('/api/auth', authRoutes);
app.use('/api/chat',chatUserRoutes);
app.use('/api/message',messageRoutes);
app.use('/api/friends',friendsRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  connectDB();
});
