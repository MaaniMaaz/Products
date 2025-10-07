const mongoose = require("mongoose");
const { Schema } = mongoose;

const historySchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
    },

    asin: {
      type:String,
      required:true,
    },
    prevPrice: {
      type:String,
      required:true,
      default:"0"
    },
    prevRoi: {
      type:String,
      required:true,
      default:"0"
    },
    prevAmazonFees: {
      type:String,
      required:true,
       default:"0"
    },
    prevAmazonBb: {
      type:String,
      required:true,
       default:"0"
    },
    prevMargin: {
      type:String,
      required:true,
       default:"0"
    },
    prevProfit: {
      type:String,
      required:true,
       default:"0"
    },
    latestPrice: {
      type:String,
      required:true
    },
    latestRoi: {
      type:String,
      required:true
    },
     latestAmazonFees: {
      type:String,
      required:true
    },
    latestAmazonBb: {
      type:String,
      required:true
    },
     latestMargin: {
      type:String,
      required:true
    },
    latestProfit: {
      type:String,
      required:true
    },
    
  },
  { timestamps: true }
);

const History = mongoose.model("History", historySchema);
module.exports = History;
