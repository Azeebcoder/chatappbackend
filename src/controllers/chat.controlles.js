import Chat from "../models/chat.model.js";

export const createChat = async (req, res) => {
  const { userIds, isGroupChat, name } = req.body;
  if (!userIds || !Array.isArray(userIds) || userIds.length < 2) {
    return res.status(400).json({ message: "At least two users are required" });
  }

  try {
    const existingChat = await Chat.findOne({
      isGroupChat: false,
      participants: { $all: userIds, $size: userIds.length },
    });

    if (existingChat) {
      return res.status(200).json(existingChat);
    }

    const newChat = await Chat.create({
      participants: userIds,
      isGroupChat,
      name: isGroupChat ? name : undefined,
    });

    res.status(201).json(newChat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


