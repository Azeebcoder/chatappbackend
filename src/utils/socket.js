// backend/utils/socket.js
import dotenv from 'dotenv';
dotenv.config(); // ✅ CALL THIS FIRST, before using process.env

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // just to test
    methods: ['GET', 'POST'],
    credentials: true
  }
});

export { io, app, server };
 