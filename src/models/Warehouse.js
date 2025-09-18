const mongoose = require("mongoose");
const { Schema } = mongoose;

const warehouseSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    name: {
      type:String,
      required:true
    },
    description: {
      type:String,
      required:true
    },
    country: {
      type:String,
      required:true
    },
    city: {
      type:String,
      required:true
    },
    
  },
  { timestamps: true }
);

const Warehouse = mongoose.model("Warehouse", warehouseSchema);
module.exports = Warehouse;
