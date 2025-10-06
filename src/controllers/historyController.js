const SuccessHandler = require("../utils/SuccessHandler");
const ErrorHandler = require("../utils/ErrorHandler");
const Brand = require("../models/Brands");
const History = require("../models/History");


// Get All History
const getAllHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const pageNumber = Math.max(parseInt(page), 1);
    const pageSize = Math.max(parseInt(limit), 1);
    const skip = (pageNumber - 1) * pageSize;

    // Query histories
    const [histories, total] = await Promise.all([
      History.find({})
        .populate("product") // populate product field (adjust the field name if needed)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize),
      History.countDocuments({}), // total count for pagination
    ]);

    return res.status(200).json({
      success: true,
      page: pageNumber,
      limit: pageSize,
      totalPages: Math.ceil(total / pageSize),
      totalRecords: total,
      history: histories,
    });
  } catch (error) {
    console.error("Error fetching history:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};


// Get Single History
const getHistoryById = async (req, res) => {
  // #swagger.tags = ['history']
  try {
    const { id } = req.params;

    const brand = await Brand.findById(id);
    if (!brand) {
      return ErrorHandler("Brand not found", 404, req, res);
    }

    return SuccessHandler({ brand }, 200, res);
  } catch (error) {
    return ErrorHandler(error.message, 500, req, res);
  }
};

module.exports = {
 getAllHistory,
 getHistoryById
};