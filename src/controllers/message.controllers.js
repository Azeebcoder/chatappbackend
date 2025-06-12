import Message from "../models/message.model.js";
import Chat from "../models/chat.model.js";



export const sendMessage = async (req, res) => {
  const { chatId, senderId, content, messageType, attachments } = req.body;

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

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMessages = async (req, res) => {
  const { chatId } = req.params;
  try {
    const messages = await Message.find({ chat: chatId }).populate("sender", "username").sort("createdAt");
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};