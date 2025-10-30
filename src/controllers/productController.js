const {  toNum, applyRoiCapWithHistory, parseUnitCost } = require("../functions/helper");

const SuccessHandler = require("../utils/SuccessHandler");
const ErrorHandler = require("../utils/ErrorHandler");
const Product = require("../models/Products");
const { createHmac } = require('crypto');
const axios = require('axios');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const Papa = require('papaparse'); // Better alternative for CSV parsing
const mongoose = require("mongoose");
const History = require("../models/History");

  // API credentials
    const apiKeyId = "8c7b051f-b0ad-4e70-9280-652f4b09c721";
    const apiKeySecret = "eba2d5e86af48563553159bdb996a55439719c243b3325cab30c9aee467866ccb976b0807a98d44421389fddae7ca5aeff136c0a4154a290c3370e3cf9fe2d4c";

const createProductByCsv = async (req, res) => {
  try {
    const { warehouse } = req.body;
    
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

    // Function to convert scientific notation to string
    const formatUPC = (value) => {
      if (!value) return null;
      const strValue = String(value).trim();
      if (strValue.includes('E') || strValue.includes('e')) {
        const num = parseFloat(strValue);
        return Math.round(num).toString();
      }
      return strValue;
    };

    // Function to parse Unit Cost (handles $ sign)
    const parseUnitCost = (value) => {
      if (!value) return null;
      
      const strValue = String(value).trim();
      
      // Remove dollar sign if present
      const cleanValue = strValue.replace(/^\$/, '');
      
      // Return the numeric value
      return cleanValue;
    };

    // Parse CSV using Papa Parse
    const parseResult = Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      transform: (value) => value.trim()
    });

    if (parseResult.errors.length > 0) {
      console.log('CSV parsing errors:', parseResult.errors);
      return ErrorHandler("Error parsing CSV file", 400, req, res);
    }

    // Extract ASINs and map CSV extras (mqc, upc, unitCost) by ASIN
    const asins = [];
    const asinToExtras = {};
    parseResult.data.forEach((row) => {
      console.log(row);
      
      const asinRaw = row["AMZ URL"] || row.ASIN || row.Asin || row.amazon_asin || row.product_asin;
      const asin = asinRaw && typeof asinRaw === 'string' ? asinRaw.trim() : asinRaw;

      const mqcRaw = row.MQC || row.mqc || row.MOC || row.moc || row.MOQ || row.moq;
      const upcRaw = row.UPC || row.upc || row.Upc;
      const unitCost = row["Unit Cost"];
      const mqc = typeof mqcRaw === 'string' ? mqcRaw.trim() : mqcRaw;
      const upc = formatUPC(upcRaw);
      const unitCostPrice = typeof unitCost === 'string' ? unitCost.trim() : unitCost;

      if (asin && String(asin).trim()) {
        const asinKey = String(asin).trim();
        asins.push(asinKey);
        asinToExtras[asinKey] = {
          mqc: mqc ?? null,
          upc: upc ?? null,
          unitCost: unitCostPrice ?? null
        };
      }
    });

    if (asins.length === 0) {
      return ErrorHandler("No valid ASINs found in CSV file", 400, req, res);
    }

    console.log(`Found ${asins.length} ASINs in CSV:`, asins.slice(0, 5));

    // Fetch product data from API
    const apiResponse = await axios.post(
      `https://app.apexapplications.io/api/data/get-asins-info`,
      { asins: asins },
      { headers }
    );

    const productsData = apiResponse.data;
    console.log(productsData, "productdata");

    // Save or update products in database
    const savedProducts = [];
    const updatedProducts = [];

    // Mark all existing products in this warehouse as deleted
    await Product.updateMany(
      { warehouse: warehouse },         
      { $set: { isDeleted: true } }  
    );
    
    for (const productData of productsData) {
      const originalPrice = toNum(parseUnitCost(asinToExtras[productData.asin]?.unitCost));
      const amazonBb = toNum(productData?.price);
      const amazonFees = toNum(productData?.fees);

      // Apply ROI cap calculation with history
      const { firstRound, secondRound, isCapped } = applyRoiCapWithHistory(
        originalPrice,
        amazonBb,
        amazonFees
      );

      const productDataPayload = {
        warehouse: warehouse,
        asin: productData.asin,
        name: productData.title,
        originalPrice: originalPrice, // Store the original price from CSV
        price: secondRound.basePrice, // Store the capped price (if capped)
        images: productData.image,
        brand: productData.brand,
        amazonBb: amazonBb,
        amazonFees: amazonFees,
        mqc: asinToExtras[productData.asin]?.mqc || null,
        upc: asinToExtras[productData.asin]?.upc || null,
        profit: secondRound.profit, // Final profit after capping
        margin: secondRound.margin, // Final margin after capping
        roi: secondRound.roi, // Final ROI after capping
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Create new product
      const newProduct = await Product.create(productDataPayload);
      savedProducts.push(newProduct);

      // Create history record if ROI was capped
      if (isCapped) {
        try {
          await History.create({
            product: newProduct._id,
            asin: newProduct.asin,
            // Previous values (first round - before capping)
            prevPrice: originalPrice,
            prevRoi: firstRound.roi,
            prevAmazonFees: amazonFees,
            prevAmazonBb: amazonBb,
            prevMargin: firstRound.margin,
            prevProfit: firstRound.profit,
            // Latest values (second round - after capping)
            latestPrice: secondRound.basePrice,
            latestRoi: secondRound.roi,
            latestAmazonFees: amazonFees,
            latestAmazonBb: amazonBb,
            latestMargin: secondRound.margin,
            latestProfit: secondRound.profit
          });
        } catch (historyError) {
          console.error('Error creating history for ASIN:', newProduct.asin, historyError);
          // Continue processing even if history creation fails
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: `Successfully processed ${savedProducts.length + updatedProducts.length} products from CSV`,
      data: {
        totalProcessed: savedProducts.length + updatedProducts.length,
        newProducts: savedProducts.length,
        updatedProducts: updatedProducts.length,
        totalAsinsInCsv: asins.length,
        products: [...savedProducts, ...updatedProducts]
      }
    });

  } catch (error) {
    console.error('Error processing CSV:', error);
    return ErrorHandler(error.message || "Error processing CSV file", 500, req, res);
  }
};

const updateProductsFromAPI = async (req, res) => {
  try {
    const products = await Product.find({});
    if (!products.length) {
      return res.status(404).json({ success: false, message: "No products found in DB" });
    }

    const asins = products.map(p => p.asin).filter(Boolean);

    const signPayload = `${Date.now()}${Math.random()}`;
    const signature = createHmac("sha256", apiKeySecret)
      .update(signPayload)
      .digest("hex");

    const headers = {
      "x-api-key-id": apiKeyId,
      "x-api-sign-input": signPayload,
      "x-api-signature": signature,
    };

    const chunkSize = 50;
    let updatedProducts = [];

    for (let i = 0; i < asins?.length; i += chunkSize) {
      console.log("updating");
      
      const chunk = asins.slice(i, i + chunkSize);

      const apiResponse = await axios.post(
        "https://app.apexapplications.io/api/data/get-asins-info",
        { asins: chunk },
        { headers }
      );

      const productsData = apiResponse.data || [];

      console.log(apiResponse, "apiResponse");
      
      for (const productData of productsData) {
        const singleProductDetail = await Product.findOne({ asin: productData?.asin });
        
        // Use originalPrice instead of price for calculations
        const originalPrice = toNum(singleProductDetail?.originalPrice);
        const amazonBb = toNum(productData?.price);
        const amazonFees = toNum(productData?.fees);

        // Apply ROI cap calculation with history
        const { firstRound, secondRound, isCapped } = applyRoiCapWithHistory(
          originalPrice,
          amazonBb,
          amazonFees
        );

        // Update the product with final values
        const updated = await Product.findOneAndUpdate(
          { asin: productData?.asin },
          {
            $set: {
              name: productData.title,
              images: productData.image,
              brand: productData.brand,
              amazonBb: amazonBb,
              amazonFees: amazonFees,
              price: secondRound.basePrice, // Final capped price
              profit: secondRound.profit, // Final profit after capping
              margin: secondRound.margin, // Final margin after capping
              roi: secondRound.roi, // Final ROI after capping
              updatedAt: new Date(),
            },
          },
          { new: true }
        );

        // If ROI was capped, create history entry
        if (isCapped) {
          const history = await History.create({
            product: singleProductDetail?._id,
            asin: singleProductDetail?.asin,
            // Previous values (first round - before capping)
            prevPrice: singleProductDetail.originalPrice,
            prevRoi: firstRound.roi,
            prevAmazonFees: singleProductDetail?.amazonFees,
            prevAmazonBb: singleProductDetail?.amazonBb,
            prevMargin: firstRound.margin,
            prevProfit: firstRound.profit,
            // Latest values (second round - after capping)
            latestPrice: secondRound.basePrice,
            latestRoi: secondRound.roi,
            latestAmazonFees: amazonFees,
            latestAmazonBb: amazonBb,
            latestMargin: secondRound.margin,
            latestProfit: secondRound.profit
          });
        }
        
        if (updated) updatedProducts.push(updated);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Updated ${updatedProducts.length} products successfully`,
      data: updatedProducts,
    });
  } catch (error) {
    console.error("Error updating products:", error);
    return res.status(500).json({ success: false, message: error.message });
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

// Get All Products (with aggregation + pagination)
const getAllProducts = async (req, res) => {
  // #swagger.tags = ['product']
  try {
    const { title, warehouse, brand, page = 1, limit = 10,profitable = false ,proper = false} = req.query;

    // Convert pagination values to numbers
    const pageNumber = Math.max(parseInt(page), 1);
    const pageSize = Math.max(parseInt(limit), 1);
    const skip = (pageNumber - 1) * pageSize;

    // Build match conditions dynamically
    const matchStage = {isDeleted:false};

    

    if (brand) {
      matchStage.brand = { $regex: brand, $options: "i" };
    }

    if (proper) {
  matchStage.name = { $exists: true, $ne: "" };
  matchStage.amazonBb = { $exists: true, $ne: "", $ne: "0" };
  matchStage.amazonFees = { $exists: true, $ne: "", $ne: "0" };
  matchStage.images = { $exists: true, $type: "array", $ne: [], $not: { $size: 0 } };
}

if (title) {
  matchStage.$or = [
    { asin: { $regex: title, $options: "i" } },
    { name: { $regex: title, $options: "i" } }
  ];
}



  

    // Warehouse filter: support both ObjectId and warehouse name (via lookup)
    let warehouseNameFilter = null;
    if (warehouse) {
      if (mongoose.Types.ObjectId.isValid(warehouse)) {
        matchStage.warehouse = new mongoose.Types.ObjectId(warehouse);
      } else {
        warehouseNameFilter = warehouse; // will apply after $lookup
      }
    }

    // Aggregation pipeline
    const pipeline = [
       {
    $addFields: {
      profitNum: { $toDouble: "$profit" } // convert string -> number
    }
  },
  {
    $match: {
      ...matchStage,
      ...(profitable ? { profitNum: { $gt: 0 } } : {})
    }
  },
      {
        $lookup: {
          from: 'warehouses',
          localField: 'warehouse',
          foreignField: '_id',
          as: 'warehouseDoc'
        }
      },
      { $unwind: { path: '$warehouseDoc', preserveNullAndEmptyArrays: true } },
      // Optional filter by warehouse name if provided as text
      ...(warehouseNameFilter
        ? [{ $match: { 'warehouseDoc.name': { $regex: warehouseNameFilter, $options: 'i' } } }]
        : []),
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: pageSize }
          ],
          totalCount: [
            { $count: 'count' }
          ]
        }
      }
    ];

    const result = await Product.aggregate(pipeline);

    const products = result[0]?.data || [];
    const total = result[0]?.totalCount[0]?.count || 0;
    const totalPages = Math.ceil(total / pageSize);

    return SuccessHandler(
      {
        products,
        pagination: {
          total,
          page: pageNumber,
          limit: pageSize,
          totalPages,
        },
      },
      200,
      res
    );
  } catch (error) {
    return ErrorHandler(error.message, 500, req, res);
  }
};

const getAllProductsForDownload = async (req, res) => {
  // #swagger.tags = ['product']
  try {
    const { title,warehouse, brand } = req.query;

    // Build match conditions dynamically
    const matchStage = {isDeleted:false,profitNum: { $gt: 0 }};

    // Filter by brand (case-insensitive)
    if (brand) {
      matchStage.brand = { $regex: brand, $options: "i" };
    }

    // Filter by warehouse
    let warehouseNameFilter = null;
    if (warehouse) {
      if (mongoose.Types.ObjectId.isValid(warehouse)) {
        matchStage.warehouse = new mongoose.Types.ObjectId(warehouse);
      } else {
        warehouseNameFilter = warehouse; // Will apply after $lookup
      }
    }

    if (title) {
      matchStage.name = { $regex: title, $options: "i" };
    }

    // Aggregation pipeline
    const pipeline = [
      {
        $addFields: {
          profitNum: { $toDouble: "$profit" }, // Convert profit to number
        },
      },
      {
        $match: matchStage,
      },
      {
        $lookup: {
          from: "warehouses",
          localField: "warehouse",
          foreignField: "_id",
          as: "warehouseDoc",
        },
      },
      { $unwind: { path: "$warehouseDoc", preserveNullAndEmptyArrays: true } },

      // Optional warehouse name filter (if warehouse provided as text)
      ...(warehouseNameFilter
        ? [
            {
              $match: {
                "warehouseDoc.name": {
                  $regex: warehouseNameFilter,
                  $options: "i",
                },
              },
            },
          ]
        : []),

      { $sort: { createdAt: -1 } },
    ];

    const products = await Product.aggregate(pipeline);

    return SuccessHandler(
      {
        products,
        total: products.length,
      },
      200,
      res
    );
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
  getAllProductsForDownload,
  getProductById,
  createProductByCsv,
  updateProductsFromAPI
};