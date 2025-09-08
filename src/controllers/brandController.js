const SuccessHandler = require("../utils/SuccessHandler");
const ErrorHandler = require("../utils/ErrorHandler");
const Brand = require("../models/Brands");

// Create Brand
const createBrand = async (req, res) => {
  // #swagger.tags = ['brand']
  try {
    const { name, description } = req.body;
    const { id: user } = req.user; 

    const brand = await Brand.create({
      name,
      description,
      user
    });

    return SuccessHandler({ brand }, 201, res);
  } catch (error) {
    return ErrorHandler(error.message, 500, req, res);
  }
};

// Update Brand
const updateBrand = async (req, res) => {
  // #swagger.tags = ['brand']
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const brand = await Brand.findById(id);
    if (!brand) {
      return ErrorHandler("Brand not found", 404, req, res);
    }

    brand.name = name ?? brand.name;
    brand.description = description ?? brand.description;

    await brand.save();

    return SuccessHandler({ brand }, 200, res);
  } catch (error) {
    return ErrorHandler(error.message, 500, req, res);
  }
};

// Delete Brand
const deleteBrand = async (req, res) => {
  // #swagger.tags = ['brand']
  try {
    const { id } = req.params;

    const brand = await Brand.findById(id);
    if (!brand) {
      return ErrorHandler("Brand not found", 404, req, res);
    }

    await brand.deleteOne();

    return SuccessHandler({ message: "Brand deleted successfully" }, 200, res);
  } catch (error) {
    return ErrorHandler(error.message, 500, req, res);
  }
};

// Get All Brands
const getAllBrands = async (req, res) => {
  // #swagger.tags = ['brand']
  try {
    const brands = await Brand.find().sort({ createdAt: -1 });

    return SuccessHandler({ brands }, 200, res);
  } catch (error) {
    return ErrorHandler(error.message, 500, req, res);
  }
};

// Get Single Brand
const getBrandById = async (req, res) => {
  // #swagger.tags = ['brand']
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
  createBrand,
  updateBrand,
  deleteBrand,
  getAllBrands,
  getBrandById,
};