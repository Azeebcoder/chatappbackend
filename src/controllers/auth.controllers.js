import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import { generateToken } from "../utils/utils.js";
import validator from "validator";
import cloudinary from "../utils/cloudnary.js";
import streamifier from "streamifier";

export const register = async (req, res) => {
  const { username, email, password, name } = req.body;

  try {
    if (!username || !email || !password || !name) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    if (!validator.isEmail(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email format" });
    }

    let profilePicUrl = "";

    if (req.file) {
      const streamUpload = (buffer) => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "users" },
            (error, result) => {
              if (result) resolve(result);
              else reject(error);
            }
          );
          streamifier.createReadStream(buffer).pipe(stream);
        });
      };

      const result = await streamUpload(req.file.buffer);
      profilePicUrl = result.secure_url;
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      name,
      profilePic: profilePicUrl,
    });

    generateToken(newUser._id, res);

    const savedUser = await newUser.save();
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        _id: savedUser._id,
        username: savedUser.username,
        email: savedUser.email,
        name: savedUser.name,
        profilePic: savedUser.profilePic,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Username and password are required" });
  }

  try {
    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "invalid credintial 1" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res
        .status(400)
        .json({ success: false, message: "invalid credintial 2" });
    }
    generateToken(user._id, res);
    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateProfile = async (req, res) => {};

export const logout = (req, res) => {
  res.send("logout page");
};

export const isAuthenticated = async (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "User is not authenticated" });
    }
    if (!req.user.isVerified) {
      return res
        .status(403)
        .json({ success: false, message: "User is not verified" });
    }
    return res.status(200).json({
      success: true,
      message: "user is authenticated",
      data: req.user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error });
  }
};
