const express = require("express");
const router = express.Router();
const { createCustomer, createCheckoutSession, stripeWebhook } = require("../controllers/paymentController");
const { isAuthenticated } = require("../middleware/auth");

router.post("/create-customer",isAuthenticated, createCustomer);
router.post("/checkout",isAuthenticated, createCheckoutSession);
router.post("/webhook", express.raw({ type: "application/json" }), stripeWebhook);

module.exports = router;
