const express = require("express");
const router = express.Router();
const auth = require("../controllers/authController");
const { isAuthenticated } = require("../middleware/auth");
const uploader = require("../utils/uploader");

router.route("/register").post(auth.register);
router.route("/login").post(auth.login);
router.route("/forgotPassword").post(auth.forgotPassword);
router.route("/resetPassword").put(auth.resetPassword);
router.route("/updatePassword").put(isAuthenticated, auth.updatePassword);
router.route("/me").get(isAuthenticated, auth.getMe);
router.route("/updateProfile").put(
  isAuthenticated,

  uploader.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "fullImage", maxCount: 1 },
  ]),
  auth.updateProfile
);

router.route("/updateAdminProfile").put(
  isAuthenticated,

  uploader.fields([
    { name: "profileImage", maxCount: 1 },
    // { name: "fullImage", maxCount: 1 },
  ]),
  auth.updateAdminProfile
);

router.route("/socialAuth").post(auth.socialAuth);

module.exports = router;
