import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized: No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
    }

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized: User not found" });
    }

    // ✅ Check if the user has verified their email
   /* if (!user.isVerified) {
      return res.status(403).json({ success: false, message: "Please verify your email" });
    }*/

    req.user = user; // attach user to request
    next();
  } catch (error) {
    console.error("Token verification failed:", error.message);
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};
