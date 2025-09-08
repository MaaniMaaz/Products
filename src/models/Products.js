const mongoose = require("mongoose");
const { Schema } = mongoose;

const productsSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    brand: {
      type: Schema.Types.ObjectId,
      ref: "Brand",
    },
    name: {
      type:String,
      required:true
    },
    description: {
      type:String,
      required:true
    },
    price: {
      type:String,
      required:true
    },
    
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productsSchema);
module.exports = Product;
