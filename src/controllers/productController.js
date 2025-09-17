const SuccessHandler = require("../utils/SuccessHandler");
const ErrorHandler = require("../utils/ErrorHandler");
const Product = require("../models/Products");
const { createHmac } = require('crypto');
const axios = require('axios');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const Papa = require('papaparse'); // Better alternative for CSV parsing
const { Readable } = require('stream');

const createProductByCsv = async (req, res) => {
  try {
    // Debug: Log the request files structure
    console.log('req.files:', req.files);
    
    // Check if file exists
    if (!req.files || !req.files.file) {
      return ErrorHandler("CSV file is required", 400, req, res);
    }

    // Handle both single file and array scenarios
    const file = Array.isArray(req.files.file) ? req.files.file[0] : req.files.file;
    
    // Debug: Log file object
    console.log('File object:', file);
    
    // Validate file type
    const fileName = file.originalname || file.name || '';
    if (!fileName.endsWith('.csv')) {
      return ErrorHandler("Please upload a CSV file", 400, req, res);
    }

    // API credentials
    const apiKeyId = "8c7b051f-b0ad-4e70-9280-652f4b09c721";
    const apiKeySecret = "eba2d5e86af48563553159bdb996a55439719c243b3325cab30c9aee467866ccb976b0807a98d44421389fddae7ca5aeff136c0a4154a290c3370e3cf9fe2d4c";

    // Create signature for API authentication
    const signPayload = `${Date.now()}${Math.random()}`;
    const signature = createHmac("sha256", apiKeySecret).update(signPayload).digest("hex");

    const headers = {
      "x-api-key-id": apiKeyId,
      "x-api-sign-input": signPayload,
      "x-api-signature": signature,
    };

    // Parse CSV directly from buffer (no filesystem needed)
    let csvData;
    
    if (file.buffer) {
      // Multer with memory storage
      csvData = file.buffer.toString('utf8');
    } else if (file.data) {
      // Express-fileupload
      csvData = file.data.toString('utf8');
    } else {
      return ErrorHandler("Unable to read uploaded file", 400, req, res);
    }

    // Parse CSV using Papa Parse
    const parseResult = Papa.parse(csvData, {
      header: true, // First row as headers
      skipEmptyLines: true,
      dynamicTyping: false, // Keep as strings
      transform: (value) => value.trim() // Trim whitespace
    });

    if (parseResult.errors.length > 0) {
      console.log('CSV parsing errors:', parseResult.errors);
      return ErrorHandler("Error parsing CSV file", 400, req, res);
    }

    // Extract ASINs from parsed data
    const asins = [];
    parseResult.data.forEach((row) => {
      console.log(row);
      
      // Check multiple possible column names for ASIN
      const asin = row["AMZ URL"] || row.ASIN || row.Asin || row.amazon_asin || row.product_asin;
      if (asin && asin.trim()) {
        asins.push(asin.trim());
      }
    });

    if (asins.length === 0) {
      return ErrorHandler("No valid ASINs found in CSV file", 400, req, res);
    }

    console.log(`Found ${asins.length} ASINs in CSV:`, asins.slice(0, 5)); // Log first 5 ASINs

    // Fetch product data from API
    const apiResponse = await axios.post(
      `https://app.apexapplications.com/api/data/get-asins-info`,
      { asins: asins },
      { headers }
    );

    const productsData = apiResponse.data;
console.log(productsData ,"productdata");

    // Save products to database
    const savedProducts = [];
    
    for (const productData of productsData) {
      // Assuming you have a Product model/schema
      // Adjust the fields based on your database schema and API response structure
      const productToSave = {
        asin: productData.asin,
        title: productData.title,
        price: productData.price,
        description: productData.description,
        imageUrl: productData.image_url,
        brand: productData.brand,
        category: productData.category,
        // Add other fields as needed
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Save to database (example using a hypothetical Product model)
      // Replace this with your actual database saving logic
      const savedProduct = await Product.create(productToSave);
      savedProducts.push(savedProduct);
    }

    // Return success response
    return res.status(200).json({
      success: true,
      message: `Successfully processed ${savedProducts.length} products from CSV`,
      data: {
        totalProcessed: savedProducts.length,
        totalAsinsInCsv: asins.length,
        products: savedProducts
      }
    });

  } catch (error) {
    console.error('Error processing CSV:', error);
    return ErrorHandler(error.message || "Error processing CSV file", 500, req, res);
  }
};

// Create Product
const createProduct = async (req, res) => {
  // #swagger.tags = ['product']
  try {
    const { name, brand,mqc,upc,asin,amazonBb,amazonFees,profit,margin,roi, price } = req.body;
    const { id: user } = req.user; 

    const product = await Product.create({
      name, brand,mqc,upc,asin,amazonBb,amazonFees,profit,margin,roi ,price
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
    const { title, warehouse, brand } = req.query;

    // Build query dynamically
    const query = {};

    if (title) {
      query.name = { $regex: title, $options: "i" }; // case-insensitive search
    }

    if (brand) {
      query.brand = { $regex: brand, $options: "i" };
    }

    if (warehouse) {
      query.warehouse = { $regex: warehouse, $options: "i" };
    }

    const products = await Product.find(query).sort({ createdAt: -1 });

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
  createProductByCsv
};