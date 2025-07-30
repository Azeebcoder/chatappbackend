import express from 'express';
import { deleteMessage, editMessage, getMessages, sendMessage } from '../controllers/message.controllers.js';
import { protectRoute } from '../middlewares/auth.middlewares.js';
import { createChat, getChatUser, getUserChats } from '../controllers/chat.controlles.js';
const router = express.Router();

router.get('/getmessage/:chatId',protectRoute,getMessages);
router.post('/sendmessage/:chatId',protectRoute,sendMessage);
router.post('/createchat',protectRoute,createChat); // Assuming createChat is similar to sendMessage
router.get("/my", protectRoute, getUserChats);
router.get("/user/:chatId", protectRoute, getChatUser);
router.delete("/delete/:messageId", protectRoute, deleteMessage);
router.put("/edit/:messageId", protectRoute, editMessage);


export default router;