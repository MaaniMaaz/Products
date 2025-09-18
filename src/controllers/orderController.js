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


// const getAllOrders = async (req, res) => {
//   // #swagger.tags = ['Order']
//   try {
//     const {
//       page = 1,
//       limit = 10,
//       warehouse,
//       sortBy = 'createdAt',
//       sortOrder = 'desc'
//     } = req.query;

//     // Convert to numbers
//     const pageNum = parseInt(page);
//     const limitNum = parseInt(limit);
//     const skip = (pageNum - 1) * limitNum;

//     // Build sort object
//     const sortObj = {};
//     sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

//     // Build aggregation pipeline
//     const pipeline = [
//       // Lookup user information first
//       {
//         $lookup: {
//           from: "users",
//           localField: "user",
//           foreignField: "_id",
//           as: "user",
//           pipeline: [
//             {
//               $project: {
//                 name: 1,
//                 email: 1
//               }
//             }
//           ]
//         }
//       },
      
//       // Convert user array to object
//       {
//         $addFields: {
//           user: { $arrayElemAt: ["$user", 0] }
//         }
//       },
      
//       // Lookup and populate products
//       {
//         $lookup: {
//           from: "products", // Replace with your actual products collection name
//           localField: "products.product",
//           foreignField: "_id",
//           as: "products.product.details"
//         }
//       },
      
//       // Reconstruct products array with populated product data
//       // {
//       //   $addFields: {
//       //     products: {
//       //       $map: {
//       //         input: "$products",
//       //         as: "orderProduct",
//       //         in: {
//       //           product: {
//       //             $arrayElemAt: [
//       //               {
//       //                 $filter: {
//       //                   input: "$populatedProducts",
//       //                   cond: { $eq: ["$$this._id", "$$orderProduct.product"] }
//       //                 }
//       //               },
//       //               0
//       //             ]
//       //           },
//       //           quantity: "$$orderProduct.quantity",
//       //           price: "$$orderProduct.price",
//       //           _id: "$$orderProduct._id"
//       //         }
//       //       }
//       //     }
//       //   }
//       // },
      
//       // // Remove the temporary populatedProducts field
//       // {
//       //   $unset: "populatedProducts"
//       // },
      
//       // // Filter by warehouse if provided (must be after product population)
//       // ...(warehouse ? [
//       //   {
//       //     $match: {
//       //       "products.product.warehouse": new mongoose.Types.ObjectId(warehouse);
//       //     }
//       //   }
//       // ] : []),
      
//       // Sort orders
//       { $sort: sortObj },
      
//       // Add pagination using facet
//       {
//         $facet: {
//           orders: [
//             { $skip: skip },
//             { $limit: limitNum }
//           ],
//           totalCount: [
//             { $count: "count" }
//           ]
//         }
//       }
//     ];

//     const result = await Order.aggregate(pipeline);
    
//     const orders = result[0].orders || [];
//     const totalCount = result[0].totalCount[0]?.count || 0;
//     const totalPages = Math.ceil(totalCount / limitNum);

//     return res.status(200).json({
//       success: true,
//       orders,
//       pagination: {
//         currentPage: pageNum,
//         totalPages,
//         totalCount,
//         hasNext: pageNum < totalPages,
//         hasPrev: pageNum > 1,
//         limit: limitNum
//       },
//       filters: {
//         warehouse: warehouse || null
//       }
//     });

//   } catch (error) {
//     console.error('Error in getAllOrders:', error);
//     return res.status(500).json({ 
//       success: false, 
//       message: error.message || "Error fetching orders"
//     });
//   }
// };


// Get My Orders (User)
const getAllOrders = async (req, res) => {
  // #swagger.tags = ['Order']
  try {
    const userId = req.user._id; // assuming middleware sets req.user

    const orders = await Order.find()
      .populate("products.product") // populate product details
      .sort({ createdAt: -1 });

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
      .populate("products.product", "name brand price images") // populate product details
      .sort({ createdAt: -1 });

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

    return res.status(200).json({ success: true, message: "Order status updated", order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createOrder,getAllOrders , getMyOrders,updateOrderStatus };
