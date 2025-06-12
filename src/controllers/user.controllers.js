// controllers/user.controller.js
import Chat from "../models/chat.model.js";
import User from "../models/user.model.js";

export const getChattedUsers = async (req, res) => {
  const userId = req.user._id;

  try {
    // Find chats where the user is a participant
    const chats = await Chat.find({ participants: userId }).populate(
      "participants",
      "-password"
    );

    // Extract unique users from those chats (excluding self)
    const chattedUsersSet = new Set();

    chats.forEach((chat) => {
      chat.participants.forEach((participant) => {
        if (participant._id.toString() !== userId.toString()) {
          chattedUsersSet.add(JSON.stringify(participant));
        }
      });
    });

    const chattedUsers = Array.from(chattedUsersSet).map((user) =>
      JSON.parse(user)
    );

    res.status(200).json({ success: true, data: chattedUsers });
  } catch (error) {
    res.status(500).json({ success: true, message: error.message });
  }
};

export const getSearchedUsers = async (req, res) => {
  const { search } = req.query;
  const currentUserId = req.user._id;

  try {
    // Find users matching the search query
    let users = await User.find({
      $or: [
        { name: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } }
      ],
      _id: { $ne: currentUserId } // Exclude current user directly in query
    }).select("username name email friendRequests");

    // Add 'isRequested' flag
    const filteredUsers = users.map(user => ({
      _id: user._id,
      username: user.username,
      name: user.name,
      email: user.email,
      isRequested: user.friendRequests.some(
        id => id.toString() === currentUserId.toString()
      )
    }));

    res.status(200).json({ success: true, data: filteredUsers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
