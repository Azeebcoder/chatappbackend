import express from "express";
import {
  sendFriendRequest,
  acceptFriendRequest,
  getFriends,
  getPendingRequests
} from "../controllers/friends.controllers.js";
import { protectRoute } from "../middlewares/auth.middlewares.js";

const router = express.Router();

router.post("/send-request",protectRoute, sendFriendRequest);
router.post("/accept-request", protectRoute,acceptFriendRequest);
router.get("/:userId/friends", protectRoute,getFriends);
router.get("/:userId/requests",protectRoute, getPendingRequests);

export default router;
