import express from "express";
import {
  sendFriendRequest,
  acceptFriendRequest,
  getFriends,
  getPendingRequests,
  deleteFriendRequest,
} from "../controllers/friends.controllers.js";
import { protectRoute } from "../middlewares/auth.middlewares.js";

const router = express.Router();

router.post("/send-request", protectRoute, sendFriendRequest);
router.post("/accept-request", protectRoute, acceptFriendRequest);
router.post("/reject-request", protectRoute, deleteFriendRequest);
router.get("/:userId/friends", protectRoute, getFriends);
router.get("/requests", protectRoute, getPendingRequests);

export default router;
