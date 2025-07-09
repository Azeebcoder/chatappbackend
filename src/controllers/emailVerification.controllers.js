import User from "../models/user.model.js";
import transporter from "../config/nodemailer.js";

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendOtp = async (req, res) => {
  const userId = req.user._id;

  if (!userId) {
    return res
      .status(400)
      .json({ success: false, message: "User ID is required" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const otpExpired = !user.otpExpires || Date.now() > user.otpExpires;

    // ✅ Send OTP only if it doesn't exist or has expired
    if (user.otp && !otpExpired) {
      return res.status(400).json({
        success: true,
        message: "OTP already sent and still valid",
      });
    }

    // Generate and save new OTP
    const otp = generateOtp();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    const sendEmailOptions = {
      from: `Spc Degree College <${process.env.SMTP_EMAIL}>`,
      to: user.email,
      subject: "Your One-Time Password (OTP) for Verification",
      text: `Your OTP is: ${otp}. It will expire in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #004aad; text-align: center;">SPC Degree College</h2>
          <p>Dear ${user.name || "Student"},</p>
          <p>We received a request to verify your identity. Please use the following One-Time Password (OTP) to complete the process:</p>
          <div style="background-color: #f2f2f2; padding: 15px; text-align: center; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 2px;">
            ${otp}
          </div>
          <p style="margin-top: 20px;">This OTP is valid for <strong>10 minutes</strong>. Do not share this code with anyone.</p>
          <p>If you did not initiate this request, please ignore this email.</p>
          <br/>
          <p>Regards,<br/>SPC Degree College, Baghpat</p>
        </div>
      `,
    };

    await transporter.sendMail(sendEmailOptions);

    res
      .status(200)
      .json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};


export const verifyOtp = async (req, res) => {
  const { otp } = req.body;
  const userId = req.user._id;
  console.log("User ID:", userId);
  console.log("OTP:", otp);
  if (!userId || !otp) {
    return res
      .status(400)
      .json({ success: false, message: "User ID and OTP are required" });
  }
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    if (user.otp !== otp) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid OTP" });
    }
    if (Date.now() > user.otpExpires) {
      return res
        .status(400)
        .json({ success: false, message: "OTP has expired" });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({ success: true, message: "OTP verified successfully" });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}
