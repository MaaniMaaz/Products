const express = require("express");
const router = express.Router();
const history = require("../controllers/historyController")
const { isAuthenticated } = require("../middleware/auth");

router.route("/").get(isAuthenticated, history.getAllHistory);
router.route("/:id").get(isAuthenticated, history.getHistoryById);


module.exports = router;
