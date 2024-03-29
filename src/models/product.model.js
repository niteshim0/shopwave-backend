import mongoose,{Schema} from "mongoose";

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: [true,"Please enter your name."]
     },
     photo: {
      type: String,
      required: [true,"Please enter your photo."]
     },
     price : {
      type: String,
      required: [true,"Please enter product price."]
     },
     stock : {
      type: Number,
      required: [true,"Please enter stock."]
     },
     category : {
      type: String,
      required: [true,"Please enter category."],
      trim:true
     },
  },
  {
    timestamps : true,
  }
)

export const Product = mongoose.model("Product",productSchema)