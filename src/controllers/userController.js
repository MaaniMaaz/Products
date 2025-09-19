const User = require("../models/User");
const SuccessHandler = require("../utils/SuccessHandler");
const ErrorHandler = require("../utils/ErrorHandler");

const getAllUsers = async (req, res) => {
  // #swagger.tags = ['User']
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    const query = {role:"user"};

    // If search keyword exists, filter by name
    if (search) {
      query.name = { $regex: search, $options: "i" }; // case-insensitive
    }

    // Pagination setup
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch users with filter, pagination
    const users = await User.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    // Count total documents for pagination info
    const totalUsers = await User.countDocuments(query);

    return SuccessHandler(
      {
        users,
        pagination: {
          total: totalUsers,
          page: parseInt(page),
          pages: Math.ceil(totalUsers / limit),
          limit: parseInt(limit),
        },
      },
      200,
      res
    );
  } catch (error) {
    return ErrorHandler(error.message, 500, req, res);
  }
};

module.exports = { getAllUsers };
