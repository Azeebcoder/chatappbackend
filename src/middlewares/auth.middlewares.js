import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

export const protectRoute = async (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        console.log(token);
        return res.status(401).json({ success: false, message: "Unauthorized: No token provided" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded) {
            return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
        }

        // ✅ Fix: Add await here
        const user = await User.findById(decoded.userId).select("-password");

        if (!user) {
            return res.status(401).json({ success: false, message: "Unauthorized: User not found" });
        }

        req.user = user; // attaching user to request
        next();
    } catch (error) {
        console.error("Token verification failed:", error.message);
        res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
};
