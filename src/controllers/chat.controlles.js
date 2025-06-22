import Chat from "../models/chat.model.js";

export const createChat = async (req, res) => {
  const { userIds, isGroupChat, name } = req.body;
  const currentUserId = req.user._id;

  if (!userIds || !Array.isArray(userIds) || userIds.length < 1) {
    return res.status(400).json({ message: "At least one other user is required" });
  }

  // Add the current user to the participants list
  const allParticipants = [...new Set([...userIds, currentUserId.toString()])];

  try {
    // Handle only for 1-on-1 chats (not group)
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
