const router = require("express").Router();
const auth = require("./auth");
const product = require("./product");
const brand = require("./brand");
const history = require("./history");
const order = require("./order");
const warehouse = require("./warehouse");
const user = require("./user");
const payment = require("./payment");

router.use("/auth", auth);
router.use("/brand", brand);
router.use("/history", history);
router.use("/product", product);
router.use("/order", order);
router.use("/warehouse", warehouse);
router.use("/user", user);
router.use("/payment", payment);

module.exports = router;
