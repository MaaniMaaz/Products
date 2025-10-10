const SuccessHandler = require("../utils/SuccessHandler");
const ErrorHandler = require("../utils/ErrorHandler");
const Warehouse = require("../models/Warehouse");
const Product = require("../models/Products");
const History = require("../models/History");

// Create Warehouse
const createWarehouse = async (req, res) => {
  // #swagger.tags = ['warehouse']
  try {
    const { name, description, country, city } = req.body;
    const { id: user } = req.user;

    const warehouse = await Warehouse.create({
      name,
      description,
      country,
      city,
      user,
    });

    return SuccessHandler({ warehouse }, 201, res);
  } catch (error) {
    return ErrorHandler(error.message, 500, req, res);
  }
};

// Update Warehouse
const updateWarehouse = async (req, res) => {
  // #swagger.tags = ['warehouse']
  try {
    const { id } = req.params;
    const { name, description, country, city } = req.body;

    const warehouse = await Warehouse.findById(id);
    if (!warehouse) {
      return ErrorHandler("Warehouse not found", 404, req, res);
    }

    warehouse.name = name ?? warehouse.name;
    warehouse.description = description ?? warehouse.description;
    warehouse.country = country ?? warehouse.country;
    warehouse.city = city ?? warehouse.city;

    await warehouse.save();

    return SuccessHandler({ warehouse }, 200, res);
  } catch (error) {
    return ErrorHandler(error.message, 500, req, res);
  }
};

// Delete Warehouse
const deleteWarehouse = async (req, res) => {
  // #swagger.tags = ['warehouse']
  try {
    const { id } = req.params;

    // 1️⃣ Check if the warehouse exists first
    const warehouse = await Warehouse.findById(id);
    if (!warehouse) {
      return ErrorHandler("Warehouse not found", 404, req, res);
    }

  

    // 4️⃣ Delete all products linked to this warehouse
      await Product.updateMany(
      { warehouse: id },         
      { $set: { isDeleted: true } }  
    );

    // 5️⃣ Delete the warehouse itself
    await warehouse.deleteOne();

    return SuccessHandler(
      { message: "Warehouse, products, and their histories deleted successfully" },
      200,
      res
    );
  } catch (error) {
    return ErrorHandler(error.message, 500, req, res);
  }
};



// Get All Warehouses
const getAllWarehouses = async (req, res) => {
  // #swagger.tags = ['warehouse']
  try {
    const warehouses = await Warehouse.find().sort({ createdAt: -1 });

    return SuccessHandler({ warehouses }, 200, res);
  } catch (error) {
    return ErrorHandler(error.message, 500, req, res);
  }
};

// Get Single Warehouse
const getWarehouseById = async (req, res) => {
  // #swagger.tags = ['warehouse']
  try {
    const { id } = req.params;

    const warehouse = await Warehouse.findById(id);
    if (!warehouse) {
      return ErrorHandler("Warehouse not found", 404, req, res);
    }

    return SuccessHandler({ warehouse }, 200, res);
  } catch (error) {
    return ErrorHandler(error.message, 500, req, res);
  }
};

module.exports = {
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  getAllWarehouses,
  getWarehouseById,
};
