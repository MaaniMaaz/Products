const express = require("express");
const router = express.Router();
const brand = require("../controllers/brandController");
const { isAuthenticated } = require("../middleware/auth");

router.route("/").get(isAuthenticated, brand.getAllBrands);
router.route("/:id").get(isAuthenticated, brand.getBrandById);
router.route("/").post(isAuthenticated, brand.createBrand);
router.route("/:id").put(isAuthenticated, brand.updateBrand);
router.route("/:id").delete(isAuthenticated, brand.deleteBrand);


module.exports = router;
