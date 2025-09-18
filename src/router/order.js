const express = require("express");
const router = express.Router();
const order = require("../controllers/orderController");
const { isAuthenticated } = require("../middleware/auth");

router.route("/").get(isAuthenticated, order.getAllOrders);
router.route("/mine").get(isAuthenticated, order.getMyOrders);
router.route("/").post(isAuthenticated, order.createOrder);
router.route("/changeStatus/:id").put(isAuthenticated, order.updateOrderStatus);


module.exports = router;
