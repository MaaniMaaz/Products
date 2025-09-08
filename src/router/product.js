const express = require("express");
const router = express.Router();
const product = require("../controllers/productController");
const { isAuthenticated } = require("../middleware/auth");

router.route("/").get(isAuthenticated, product.getAllProducts);
router.route("/:id").get(isAuthenticated, product.getProductById);
router.route("/").post(isAuthenticated, product.createProduct);
router.route("/:id").put(isAuthenticated, product.updateProduct);
router.route("/:id").delete(isAuthenticated, product.deleteProduct);


module.exports = router;
