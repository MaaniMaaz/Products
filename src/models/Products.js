const mongoose = require("mongoose");
const { Schema } = mongoose;

const productsSchema = new Schema(
  {
    
    name: {
      type:String,
      required:true
    },
    images:[],
    brand:{
       type:String,
      required:true
    },
    mqc:{
       type:String,
      required:true
    },
    upc:{
       type:String,
      required:true
    },
    asin:{
       type:String,
      required:true
    },
    amazonBb:{
       type:String,
      required:true
    },
    amazonFees:{
       type:String,
      required:true
    },
    profit:{
       type:String,
      required:true
    },
    margin:{
       type:String,
      required:true
    },
    roi:{
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
