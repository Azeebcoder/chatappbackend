import express from 'express';
import { protectRoute } from '../middlewares/auth.middlewares.js';
import { getChattedUsers, getSearchedUsers } from '../controllers/user.controllers.js';

const router = express.Router();

router.get('/getchatteduser', protectRoute,getChattedUsers)
router.get('/searchedusers', protectRoute,getSearchedUsers);

export default router;
