import User from "../models/user.model.js";

export const sendFriendRequest = async (req, res) => {
  const fromUserId = req.user?._id; // comes from auth middleware
  const { toUserId } = req.body;

  console.log("From User ID:", fromUserId);
  console.log("To User ID:", toUserId);

  // Validation
  if (!fromUserId || !toUserId) {
    return res
      .status(400)
      .json({ message: "Both sender and recipient IDs are required." });
  }

  if (fromUserId.toString() === toUserId.toString()) {
    return res
      .status(400)
      .json({ message: "You cannot send a friend request to yourself." });
  }

  try {
    const [fromUser, toUser] = await Promise.all([
      User.findById(fromUserId),
      User.findById(toUserId),
    ]);

    if (!toUser || !fromUser) {
      return res.status(404).json({ message: "User not found." });
    }

    if (toUser.friends?.includes(fromUserId)) {
      return res.status(400).json({ message: "You are already friends." });
    }

    if (
      toUser.friendRequests.some(
        (id) => id.toString() === fromUserId.toString()
      )
    ) {
      return res.status(400).json({ message: "Friend request already sent." });
    }
   

    // Send request
    toUser.friendRequests.push(fromUserId);
    await toUser.save();

    res.status(200).json({ message: "Friend request sent successfully." });
  } catch (err) {
    console.error("Friend request error:", err);
    res
      .status(500)
      .json({ message: "Something went wrong. Please try again." });
  }
};

export const acceptFriendRequest = async (req, res) => {
  const userId = req.user._id; // comes from auth middleware
  const { requesterId } = req.body; // requesterId is passed in the URL
  try {
    const user = await User.findById(userId);
    const requester = await User.findById(requesterId);

    if (!user.friendRequests.includes(requesterId)) {
      return res.status(400).json({ message: "No such friend request." });
    }

    user.friends.push(requesterId);
    requester.friends.push(userId);

    user.friendRequests = user.friendRequests.filter(
      (id) => id.toString() !== requesterId
    );
    await user.save();
    await requester.save();

    res.status(200).json({ message: "Friend request accepted." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteFriendRequest = async (req,res) => {
  const userId = req.user._id; // comes from auth middleware
  const { requestId } = req.body; // requestId is passed in the URL

  try {
    const user = await User.findById(userId);

    if (!user.friendRequests.includes(requestId)) {
      return res.status(400).json({ message: "No such friend request." });
    }

    user.friendRequests = user.friendRequests.filter(
      (id) => id.toString() !== requestId
    );
    await user.save();

    res.status(200).json({ message: "Friend request deleted." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export const getFriends = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).populate("friends", "-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ success: true, data: user.friends });
  } catch (error) {
    res.status(500).json({ success: true, message: error.message });
  }
};

export const getPendingRequests = async (req, res) => {
  const userId = req.user._id;
  try {
    const user = await User.findById(userId).populate(
      "friendRequests",
      "username name"
    );
    res.status(200).json({ success: true, data: user.friendRequests });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
