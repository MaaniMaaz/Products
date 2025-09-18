const express = require("express");
const router = express.Router();
const warehouse = require("../controllers/warehouseController");
const { isAuthenticated } = require("../middleware/auth");

router.route("/").get(isAuthenticated, warehouse.getAllWarehouses);
router.route("/:id").get(isAuthenticated, warehouse.getWarehouseById);
router.route("/").post(isAuthenticated, warehouse.createWarehouse);
router.route("/:id").put(isAuthenticated, warehouse.updateWarehouse);
router.route("/:id").delete(isAuthenticated, warehouse.deleteWarehouse);


module.exports = router;
