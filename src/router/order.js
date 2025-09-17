const express = require("express");
const router = express.Router();
const order = require("../controllers/orderController");
const { isAuthenticated } = require("../middleware/auth");

router.route("/").post(isAuthenticated, order.createOrder);


module.exports = router;
