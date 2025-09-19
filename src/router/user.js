const express = require("express");
const router = express.Router();
const user = require("../controllers/userController");
const { isAuthenticated } = require("../middleware/auth");

router.route("/").get(isAuthenticated, user.getAllUsers);


module.exports = router;
