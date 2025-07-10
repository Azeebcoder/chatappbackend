import Chat from "../models/chat.model.js";
import User from "../models/user.model.js";

// Create or fetch 1-on-1 or group chat
export const createChat = async (req, res) => {
  const { userIds, isGroupChat, name } = req.body;
  const currentUserId = req.user._id;

  if (!userIds || !Array.isArray(userIds) || userIds.length < 1) {
    return res.status(400).json({ message: "At least one other user is required" });
  }

  const allParticipants = [...new Set([...userIds, currentUserId.toString()])];

  try {
    if (!isGroupChat && allParticipants.length === 2) {
      const existingChat = await Chat.findOne({
        isGroupChat: false,
        participants: { $all: allParticipants, $size: 2 },
      }).populate("participants", "-password");

      if (existingChat) {
        return res.status(200).json(existingChat);
      }
    }

    const newChat = await Chat.create({
      participants: allParticipants,
      isGroupChat,
      name: isGroupChat ? name : undefined,
    });

    const fullChat = await Chat.findById(newChat._id).populate("participants", "-password");

    res.status(201).json(fullChat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get all chats for the current user
export const getUserChats = async (req, res) => {
  const userId = req.user._id;

  try {
    const chats = await Chat.find({
      participants: userId,
    })
      .populate("participants", "-password")
      .sort({ updatedAt: -1 });

    res.status(200).json(chats);
  } catch (err) {
    res.status(500).json({ message: "Failed to get chats", error: err.message });
  }
};

// ✅ Get the other user in a 1-on-1 chat (used in ChatBox top bar)
export const getChatUser = async (req, res) => {
  const userId = req.user._id;
  const { chatId } = req.params;

  try {
    const chat = await Chat.findById(chatId).populate("participants", "-password");
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    if (chat.isGroupChat) {
      return res.status(400).json({ message: "Not a 1-on-1 chat" });
    }

    const otherUser = chat.participants.find((p) => p._id.toString() !== userId.toString());
    if (!otherUser) return res.status(404).json({ message: "Other user not found" });

    res.status(200).json(otherUser);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch chat user", error: err.message });
  }
};
