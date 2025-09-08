const SuccessHandler = require("../utils/SuccessHandler");
const ErrorHandler = require("../utils/ErrorHandler");
const Product = require("../models/Products");


// Create Product
const createProduct = async (req, res) => {
  // #swagger.tags = ['product']
  try {
    const { name, description, price, brand } = req.body;
    const { id: user } = req.user; 

    const product = await Product.create({
      name,
      description,
      price,
      brand,
      user
    });

    return SuccessHandler({ product }, 201, res);
  } catch (error) {
    return ErrorHandler(error.message, 500, req, res);
  }
};

// Update Product
const updateProduct = async (req, res) => {
  // #swagger.tags = ['product']
  try {
    const { id } = req.params;
    const { name, description, price, brand } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return ErrorHandler("Product not found", 404, req, res);
    }

    product.name = name ?? product.name;
    product.description = description ?? product.description;
    product.price = price ?? product.price;
    product.brand = brand ?? product.brand;

    await product.save();

    return SuccessHandler({ product }, 200, res);
  } catch (error) {
    return ErrorHandler(error.message, 500, req, res);
  }
};

// Delete Product
const deleteProduct = async (req, res) => {
  // #swagger.tags = ['product']
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return ErrorHandler("Product not found", 404, req, res);
    }

    await product.deleteOne();

    return SuccessHandler({ message: "Product deleted successfully" }, 200, res);
  } catch (error) {
    return ErrorHandler(error.message, 500, req, res);
  }
};

// Get All Products
const getAllProducts = async (req, res) => {
  // #swagger.tags = ['product']
  try {
    const products = await Product.find()
      .populate("brand", "name") // optional: populate brand name
      .sort({ createdAt: -1 });

    return SuccessHandler({ products }, 200, res);
  } catch (error) {
    return ErrorHandler(error.message, 500, req, res);
  }
};

// Get Single Product
const getProductById = async (req, res) => {
  // #swagger.tags = ['product']
  try {
    const { id } = req.params;

    const product = await Product.findById(id).populate("brand", "name");
    if (!product) {
      return ErrorHandler("Product not found", 404, req, res);
    }

    return SuccessHandler({ product }, 200, res);
  } catch (error) {
    return ErrorHandler(error.message, 500, req, res);
  }
};

module.exports = {
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProducts,
  getProductById,
};