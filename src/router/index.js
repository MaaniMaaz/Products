const router = require("express").Router();
const auth = require("./auth");
const brand = require("./brand");
const product = require("./product");

router.use("/auth", auth);
router.use("/brand", brand);
router.use("/product", product);

module.exports = router;
