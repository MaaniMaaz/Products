const router = require("express").Router();
const auth = require("./auth");
const brand = require("./brand");
const product = require("./product");
const order = require("./order");
const warehouse = require("./warehouse");

router.use("/auth", auth);
router.use("/brand", brand);
router.use("/product", product);
router.use("/order", order);
router.use("/warehouse", warehouse);

module.exports = router;
