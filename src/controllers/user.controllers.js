import Chat from "../models/chat.model.js";
import User from "../models/user.model.js";
import onlineUsers from "../utils/onlineUsers.js";

// 🟢 Get users with whom the logged-in user has chatted
export const getChattedUsers = async (req, res) => {
  const userId = req.user._id;

  try {
    const chats = await Chat.find({ participants: userId }).populate(
      "participants",
      "-password"
    );

    const chattedUsersMap = new Map();

    chats.forEach((chat) => {
      chat.participants.forEach((participant) => {
        if (participant._id.toString() !== userId.toString()) {
          chattedUsersMap.set(participant._id.toString(), {
            chats: chat._id,
            _id: participant._id,
            username: participant.username,
            name: participant.name,
            email: participant.email,
            profilePic: participant.profilePic || "",
            lastSeen: participant.lastSeen || null,
            isOnline: onlineUsers.has(participant._id.toString()),
          });
        }
      });
    });

    const chattedUsers = Array.from(chattedUsersMap.values());

    res.status(200).json({ success: true, data: chattedUsers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🔍 Search users with query & exclude self
export const getSearchedUsers = async (req, res) => {
  const { search } = req.query;
  const currentUserId = req.user._id;

  try {
    const currentUser = await User.findById(currentUserId).select("friends");

    const users = await User.find({
      $or: [
        { name: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
      ],
      _id: { $ne: currentUserId },
    }).select("username name email profilePic friendRequests lastSeen");

    const filteredUsers = users.map((user) => ({
      _id: user._id,
      username: user.username,
      name: user.name,
      email: user.email,
      profilePic: user.profilePic || "",
      lastSeen: user.lastSeen || null,
      isOnline: onlineUsers.has(user._id.toString()),
      isRequested: user.friendRequests.includes(currentUserId),
      isFriend: currentUser.friends.includes(user._id),
    }));

    res.status(200).json({ success: true, data: filteredUsers });
  } catch (error) {
    console.error("🔴 getSearchedUsers error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🟢 Get current user's profile
export const getCurrentUserProfile = async (req, res) => {
  const userId = req.user._id;

  try {
    const user = await User.findById(userId)
      .select("username name email profilePic friends lastSeen")
      .populate("friends", "username name profilePic");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      data: {
        ...user.toObject(),
        isOnline: onlineUsers.has(user._id.toString()),
      },
    });
  } catch (error) {
    console.error("🔴 getCurrentUserProfile error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🟢 Get selected user's profile
export const getSelectedUserProfile = async (req, res) => {
  const userId = req.params.userId;
  const currentUserId = req.user._id;

  try {
    const user = await User.findById(userId)
      .select("username name email profilePic friends friendRequests lastSeen");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isRequested = user.friendRequests.includes(currentUserId);
    const isFriend = user.friends.includes(currentUserId);
    const isOnline = onlineUsers.has(user._id.toString());

    res.status(200).json({
      success: true,
      data: {
        ...user.toObject(),
        isRequested,
        isFriend,
        isOnline,
        lastSeen: user.lastSeen || null,
      },
    });
  } catch (error) {
    console.error("🔴 getSelectedUserProfile error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
