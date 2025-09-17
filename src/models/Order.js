const mongoose = require("mongoose");
const { Schema } = mongoose;

const orderSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    products: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        qnt: {
          type: Number,
          required: true,
          min: 1,
        },
        unitPrice: {
          type: Number,
          required: true,
        },
      },
    ],
    clientDetails: {
      type: Schema.Types.Mixed,
    },
    billingAddress: {
      type: Schema.Types.Mixed, 
    },
    preference: {
      type: Schema.Types.Mixed,
    },
    tax: {
      type: String,
      default: "0",
    },
    totalPrice: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
