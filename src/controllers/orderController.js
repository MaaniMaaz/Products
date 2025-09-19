// order.controller.js
const Order = require("../models/Order");
const sendOrderMail = require("../utils/SendOrderConfirmMail");
// const sendOrderConfirmationMail = require("../utils/SendOrderConfirmMail");
const mongoose = require("mongoose");
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


const getAllOrders = async (req, res) => {
  // #swagger.tags = ['Order']
  try {
    const { warehouse, orderId ,user} = req.query;

    // Base pipeline
    const pipeline = [
      // Unwind products array
      { $unwind: "$products" },

      // Lookup to join Product collection
      {
        $lookup: {
          from: "products", // collection name in MongoDB
          localField: "products.product",
          foreignField: "_id",
          as: "productDetails",
        },
      },

      // Flatten productDetails (since lookup returns an array)
      { $unwind: "$productDetails" },
    ];

    // Conditionally add user filter
    if (user) {
      pipeline.push({
        $match: {
          "user": new mongoose.Types.ObjectId(user),
        },
      });
    }
    // Conditionally add warehouse filter
    if (warehouse) {
      pipeline.push({
        $match: {
          "productDetails.warehouse": new mongoose.Types.ObjectId(warehouse),
        },
      });
    }

    // Conditionally add orderId search (partial text search on _id)
    if (orderId) {
      pipeline.push({
        $match: {
          $expr: {
            $regexMatch: {
              input: { $toString: "$_id" },
              regex: orderId,
              options: "i", // case-insensitive
            },
          },
        },
      });
    }

    // Continue pipeline
    pipeline.push(
      {
        $group: {
          _id: "$_id",
          user: { $first: "$user" },
          clientDetails: { $first: "$clientDetails" },
          billingAddress: { $first: "$billingAddress" },
          preference: { $first: "$preference" },
          tax: { $first: "$tax" },
          status: { $first: "$status" },
          totalPrice: { $first: "$totalPrice" },
          createdAt: { $first: "$createdAt" },
          updatedAt: { $first: "$updatedAt" },
          products: {
            $push: {
              qnt: "$products.qnt",
              unitPrice: "$products.unitPrice",
              product: "$productDetails",
            },
          },
        },
      },
      // Sort by creation date (latest first)
      { $sort: { createdAt: -1 } }
    );

    const orders = await Order.aggregate(pipeline);

    return res.status(200).json({ success: true, orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};




// Get My Orders (User)
// const getAllOrders = async (req, res) => {
//   // #swagger.tags = ['Order']
//   try {
//     const userId = req.user._id; // assuming middleware sets req.user

//     const orders = await Order.find()
//       .populate("products.product") // populate product details
//       .sort({ createdAt: -1 });

//     return res.status(200).json({ success: true, orders });
//   } catch (error) {
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };

// Get My Orders (User)
const getMyOrders = async (req, res) => {
  // #swagger.tags = ['Order']
  try {
    const { orderId, status } = req.query;
    const userId = req.user._id; // from middleware

    const filter = { user: userId };

    // Full-text search on orderId (_id as string)
    if (orderId) {
      filter._id = { $regex: orderId, $options: "i" }; // partial & case-insensitive
    }

    // Filter by status if provided
    if (status) {
      filter.status = status.toLowerCase();
    }

    const orders = await Order.aggregate([
      {
        $addFields: {
          orderIdStr: { $toString: "$_id" }, // convert ObjectId to string
        },
      },
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          ...(status && { status: status.toLowerCase() }),
          ...(orderId && { orderIdStr: { $regex: orderId, $options: "i" } }),
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "products.product",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $addFields: {
          products: {
            $map: {
              input: "$products",
              as: "p",
              in: {
                qnt: "$$p.qnt",
                unitPrice: "$$p.unitPrice",
                product: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$productDetails",
                        as: "pd",
                        cond: { $eq: ["$$pd._id", "$$p.product"] },
                      },
                    },
                    0,
                  ],
                },
              },
            },
          },
        },
      },
      { $project: { productDetails: 0, orderIdStr: 0 } }, // remove helper fields
      { $sort: { createdAt: -1 } },
    ]);

    return res.status(200).json({ success: true, orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update Order Status
const updateOrderStatus = async (req, res) => {
  // #swagger.tags = ['Order']
  try {
    const { id } = req.params; // order id
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: "Status is required" });
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    )
      .populate("user", "name email")
      .populate("products.product", "title brand price");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Send status email if user email exists
    if (order.user?.email) {
      await sendOrderMail(
        order.user.email,
        order._id.toString().slice(0, 8), // short ID
        status // dynamic status: confirmed, shipped, cancelled
      );
    }

    return res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      order,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};



module.exports = { createOrder,getAllOrders , getMyOrders,updateOrderStatus };
