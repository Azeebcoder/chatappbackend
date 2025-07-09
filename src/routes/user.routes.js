import express from 'express';
import { protectRoute } from '../middlewares/auth.middlewares.js';
import { getChattedUsers, getCurrentUserProfile, getSearchedUsers,getSelectedUserProfile } from '../controllers/user.controllers.js';

const router = express.Router();

router.get('/getchatteduser', protectRoute,getChattedUsers);
router.get('/searchedusers', protectRoute,getSearchedUsers);
router.get('/profile/:userId', protectRoute,getSelectedUserProfile);
router.get('/me', protectRoute,getCurrentUserProfile);

export default router;
