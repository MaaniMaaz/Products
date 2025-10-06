const mongoose = require("mongoose");
const { Schema } = mongoose;

const productsSchema = new Schema(
  {
    warehouse: {
      type: Schema.Types.ObjectId,
      ref: "Warehouse",
    },
    name: {
      type:String,
    },
    images:[],
    brand:{
       type:String,
       default:"-"
    },
    mqc:{
       type:String,
      default:"-"
    },
    upc:{
       type:String,
       default:"-"
    },
    asin:{
       type:String,
       unique:true,
       default:"-"
    },
    amazonBb:{
       type:String,
       default:"-"
    },
    amazonFees:{
       type:String,
       default:"-"
    },
    profit:{
       type:String,
       default:"-"
    },
    margin:{
       type:String,
       default:"-"
    },
    roi:{
       type:String,
       default:"-"
    },
    
    price: {
      type:String,
       default:"-"
    },
    
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productsSchema);
module.exports = Product;
