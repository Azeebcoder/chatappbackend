import express from 'express';
import { getMessages, sendMessage } from '../controllers/message.controllers.js';
import { protectRoute } from '../middlewares/auth.middlewares.js';
import { createChat } from '../controllers/chat.controlles.js';
const router = express.Router();

router.get('/getmessage/:chatId',protectRoute,getMessages);
router.post('/sendmessage/:chatId',protectRoute,sendMessage);
router.post('/createchat',protectRoute,createChat); // Assuming createChat is similar to sendMessage

export default router;