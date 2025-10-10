const express = require("express");
const router = express.Router();
const product = require("../controllers/productController");
const { isAuthenticated } = require("../middleware/auth");
const uploader = require("../utils/uploader");

router.route("/").get(isAuthenticated, product.getAllProducts);
router.route("/download").get(isAuthenticated, product.getAllProductsForDownload);
router.route("/update-product").get(isAuthenticated, product.updateProductsFromAPI);
router.route("/:id").get(isAuthenticated, product.getProductById);
router.route("/csv").post(isAuthenticated, uploader.fields([
    { name: "file", maxCount: 1 },
  ]), product.createProductByCsv);
router.route("/").post(isAuthenticated, product.createProduct);
router.route("/:id").put(isAuthenticated, product.updateProduct);
router.route("/:id").delete(isAuthenticated, product.deleteProduct);


module.exports = router;
