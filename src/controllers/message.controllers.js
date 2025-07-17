import Message from "../models/message.model.js";
import Chat from "../models/chat.model.js";
import mongoose from "mongoose";
import { io } from "../utils/socket.js"; // ✅ import the Socket.IO instance

export const sendMessage = async (req, res) => {
  const { chatId } = req.params;
  const senderId = req.user._id;
  const { content, messageType, attachments } = req.body;

  if (!chatId || !senderId || !content) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const newMessage = await Message.create({
      sender: senderId,
      chat: chatId,
      content,
      messageType,
      attachments,
    });

    await Chat.findByIdAndUpdate(chatId, { lastMessage: newMessage._id });

    // ✅ Emit the new message to all clients in the chat room
    const populatedMessage = await newMessage.populate("sender", "username"); // Optional but useful
    io.to(chatId).emit("newMessage", populatedMessage);

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const getMessages = async (req, res) => {
  const { chatId } = req.params;
  const { limit = 20, skip = 0 } = req.query;

  try {
    const messages = await Message.find({ chat: chatId })
      .sort({ createdAt: -1 }) // Newest first
      .skip(Number(skip))
      .limit(Number(limit))
      .populate("sender", "username profilePic name");

    res.status(200).json(messages.reverse()); // Reversed to display oldest first in frontend
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

