// order.controller.js
const Order = require("../models/Order");

// Create Order
const createOrder = async (req, res) => {
  // #swagger.tags = ['Order']
  try {
    const { id: user } = req.user; 
    const {  products, clientDetails, billingAddress, preference, tax, totalPrice } = req.body;

    // basic validation
    if ( !products || !products.length) {
      return res.status(400).json({ success: false, message: "Products are required" });
    }

    const order = new Order({
      user,
      products,
      clientDetails,
      billingAddress,
      preference,
      tax,
      totalPrice,
    });

    await order.save();

    return res.status(201).json({ success: true, message: "Order created successfully", order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get All Orders (Admin)
const getAllOrders = async (req, res) => {
  // #swagger.tags = ['Order']
  try {
    const orders = await Order.find()
     
    return res.status(200).json({ success: true, orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get My Orders (User)
const getMyOrders = async (req, res) => {
  // #swagger.tags = ['Order']
  try {
    const userId = req.user._id; // assuming middleware sets req.user

    const orders = await Order.find({ user: userId })
      

    return res.status(200).json({ success: true, orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createOrder,getAllOrders , getMyOrders };
