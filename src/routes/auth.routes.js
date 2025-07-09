import express from 'express';

import { login,register,logout, updateProfile, isAuthenticated } from '../controllers/auth.controllers.js';
import { sendOtp, verifyOtp } from '../controllers/emailVerification.controllers.js';
import {protectRoute} from '../middlewares/auth.middlewares.js'
import upload from '../middlewares/upload.js';

const router = express.Router();

router.post("/register", upload.single("profilePic"), register);

router.post('/login', login);

router.get('/logout', logout);

router.get('/send-otp',protectRoute,sendOtp);

router.put('/verify-otp',protectRoute,verifyOtp);

router.put('/update-profile',protectRoute, upload.single("file"),updateProfile);

router.get('/is-authenticated',protectRoute,isAuthenticated)


export default router;