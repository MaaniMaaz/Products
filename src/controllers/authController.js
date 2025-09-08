const User = require("../models/User/user");
const sendMail = require("../utils/sendMail");
const SuccessHandler = require("../utils/SuccessHandler");
const ErrorHandler = require("../utils/ErrorHandler");
const ejs = require("ejs");
const path = require("path");
const { uploadFiles, deleteFile } = require("../utils/aws");
const cloud = require("../functions/cloudinary");

//register
const register = async (req, res) => {
  // #swagger.tags = ['auth']
  try {
    const { name, email, password, phone, deviceToken } = req.body;
    const user = await User.findOne({ $or: [{ email, phone }] });
    if (user) {
      const msg =
        user.email === email
          ? "User already exists"
          : "Phone number already exists";
      return ErrorHandler(msg, 400, req, res);
    }

    const newUser = await User.create({
      name,
      email,
      phone,
      password,
      deviceToken: deviceToken || null,
      provider: "app",
    });
    newUser.save();

    const jwtToken = newUser.getJWTToken();
    return SuccessHandler(
      {
        token: jwtToken,
        user: newUser,
        signup: true,
      },
      200,
      res
    );
  } catch (error) {
    return ErrorHandler(error.message, 500, req, res);
  }
};

//login
const login = async (req, res) => {
  // #swagger.tags = ['auth']

  try {
    const { email, password, deviceToken } = req.body;
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return ErrorHandler("User does not exist", 400, req, res);
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return ErrorHandler("Invalid credentials", 400, req, res);
    }
    if (deviceToken) {
      user.deviceToken = deviceToken;
      await user.save();
    }
    jwtToken = user.getJWTToken();
    return SuccessHandler(
      {
        token: jwtToken,
        user,
      },
      200,
      res
    );
  } catch (error) {
    return ErrorHandler(error.message, 500, req, res);
  }
};

//forgot password
const forgotPassword = async (req, res) => {
  // #swagger.tags = ['auth']

  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return ErrorHandler("User does not exist", 400, req, res);
    }
    const passwordResetToken = Math.floor(100000 + Math.random() * 900000);
    const passwordResetTokenExpires = new Date(Date.now() + 10 * 60 * 1000);
    user.passwordResetToken = passwordResetToken;
    user.passwordResetTokenExpires = passwordResetTokenExpires;
    console.log(passwordResetToken);
    await user.save();
    const ejTemp = await ejs.renderFile(
      `${path.join(__dirname, "../ejs")}/forgetPassword.ejs`,
      { otp: passwordResetToken }
    );
    const subject = `Password reset token`;
    await sendMail(email, subject, ejTemp);
    return SuccessHandler(`Password reset token sent to ${email}`, 200, res);
  } catch (error) {
    return ErrorHandler(error.message, 500, req, res);
  }
};

//reset password
const resetPassword = async (req, res) => {
  // #swagger.tags = ['auth']

  try {
    const { email, passwordResetToken, password } = req.body;
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return ErrorHandler("User does not exist", 400, req, res);
    }
    if (
      user.passwordResetToken.toString() !== passwordResetToken.toString() ||
      user.passwordResetTokenExpires < Date.now()
    ) {
      return ErrorHandler("Invalid token", 400, req, res);
    }
    user.password = password;
    user.passwordResetToken = null;
    user.passwordResetTokenExpires = null;
    await user.save();
    return SuccessHandler("Password reset successfully", 200, res);
  } catch (error) {
    return ErrorHandler(error.message, 500, req, res);
  }
};

//update password
const updatePassword = async (req, res) => {
  // #swagger.tags = ['auth']

  try {
    const { currentPassword, newPassword } = req.body;
    // if (
    //   !newPassword.match(
    //     /(?=[A-Za-z0-9@#$%^&+!=]+$)^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[@#$%^&+!=])(?=.{8,}).*$/
    //   )
    // ) {
    //   return ErrorHandler(
    //     "Password must contain at least 8 characters, 1 uppercase, 1 lowercase, 1 number and 1 special character",
    //     400,
    //     req,
    //     res
    //   );
    // }
    const user = await User.findById(req.user.id).select("+password");
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return ErrorHandler("Invalid credentials", 400, req, res);
    }
    const samePasswords = await user.comparePassword(newPassword);
    if (samePasswords) {
      return ErrorHandler(
        "New password cannot be same as old password",
        400,
        req,
        res
      );
    }
    user.password = newPassword;
    await user.save();
    return SuccessHandler("Password updated successfully", 200, res);
  } catch (error) {
    return ErrorHandler(error.message, 500, req, res);
  }
};

const updateProfile = async (req, res) => {
  // #swagger.tags = ['auth']

  try {
    const data = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return ErrorHandler("User does not exist", 400, req, res);
    }

    let profileLink = user?.athleticDetails?.profileImage;
    let fullLink = user?.athleticDetails?.fullImage;

    if (req.files) {
      if (req.files?.profileImage[0]) {
        console.log("profileImage");

        const img = req.files.profileImage[0];
        const filePath = `${Date.now()}-${path.parse(img?.originalname)?.name}`;
        const url = await cloud.uploadStreamImage(img.buffer, filePath);
        if (profileLink) {
          await cloud.deleteImage(profileLink);
        }
        profileLink = url.secure_url;

        // const awsRes = await uploadFiles([req.files.profileImage]);
        // if (awsRes.length > 0) {
        //   await deleteFile(user.athleticDetails.profileImage);
        // }
        // profileLink = awsRes[0];
      }
      if (req.files?.fullImage[0]) {
        console.log("fullImage");

        const img = req.files.fullImage[0];
        const filePath = `${Date.now()}-${path.parse(img?.originalname)?.name}`;
        const url = await cloud.uploadStreamImage(img.buffer, filePath);
        if (fullLink) {
          await cloud.deleteImage(fullLink);
        }

        fullLink = url.secure_url;
        // const awsRes = await uploadFiles([req.files.fullImage]);
        // if (awsRes.length > 0) {
        //   await deleteFile(user.athleticDetails.fullImage);
        // }
        // fullLink = awsRes[0];
      }
    }
    if (data.email || data.password) {
      return ErrorHandler(
        "Email and password cannot be updated here",
        400,
        req,
        res
      );
    }

    const updated = await User.findByIdAndUpdate(
      req.user._id,
      {
        ...data,
        athleticDetails: {
          ...(req.body.athleticDetails || user.athleticDetails),
          profileImage: profileLink,
          fullImage: fullLink,
        },
      },
      {
        new: true,
      }
    );
    return SuccessHandler(updated, 200, res);
  } catch (error) {
    return ErrorHandler(error.message, 500, req, res);
  }
};

const getMe = async (req, res) => {
  // #swagger.tags = ['auth']
  try {
    const user = await User.findById(req.user._id);
    return SuccessHandler(user, 200, res);
  } catch (error) {
    return ErrorHandler(error.message, 500, req, res);
  }
};

const updateAdminProfile = async (req, res) => {
  // #swagger.tags = ['auth']
  try {
    const { name, country, phone, zip } = req.body;

    const user = await User.findById(req.user._id);
    let profileLink =
      req.body?.profileImage === "null"
        ? null
        : user?.athleticDetails?.profileImage;

    if (
      req.files &&
      req.files?.profileImage &&
      req.files?.profileImage?.length > 0
    ) {
      const img = req.files.profileImage[0];
      const filePath = `${Date.now()}-${path.parse(img?.originalname)?.name}`;
      const url = await cloud.uploadStreamImage(img.buffer, filePath);
      if (profileLink) {
        await cloud.deleteImage(profileLink);
      }
      profileLink = url.secure_url;
    }

    const updated = await User.findByIdAndUpdate(
      req.user._id,
      {
        name,
        country,
        phone,
        zip,
        athleticDetails: {
          // ...(req.body.athleticDetails || user.athleticDetails),
          profileImage: profileLink,
        },
      },
      {
        new: true,
      }
    );

    return SuccessHandler(updated, 200, res);
  } catch (error) {
    return ErrorHandler(error.message, 500, req, res);
  }
};

const socialAuth = async (req, res) => {
  // #swagger.tags = ['auth']
  try {
    const { email, name } = req.body;

    const exUser = await User.findOne({ email });
    console.log(exUser);
    if (exUser && exUser.provider === "google") {
      const token = await exUser.getJWTToken();
      if (req.body?.deviceToken) {
        exUser.deviceToken = req.body.deviceToken;
        await exUser.save();
      }
      return SuccessHandler({ token, user: exUser }, 200, res);
    } else if (exUser && exUser.provider !== "google") {
      return ErrorHandler(
        "You have previously signed up with password. Use password instead",
        400,
        req,
        res
      );
    } else {
      const user = await User.create({
        email,
        name,
        provider: "google",
        deviceToken: req.body?.deviceToken || null,
      });
      const token = await user.getJWTToken();
      return SuccessHandler({ token, user, signup: true }, 200, res);
    }
  } catch (error) {
    console.log(error);
    return ErrorHandler(error.message, 500, req, res);
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  updatePassword,
  getMe,
  updateProfile,
  updateAdminProfile,
  socialAuth,
};
