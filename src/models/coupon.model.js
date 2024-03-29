import mongoose,{Schema} from "mongoose";

const couponSchema = new Schema(
  {
    code : {
      type : String,
      required : [true,"Please enter the Coupon code"],
      unique : true
    },

    amount : {
      type : Number,
      required : [true,"Coupn code hai to kucch toh discount hoga"]
    }
  },
  {
    timestamps : true
  }
)


export const Coupon = new mongoose.model("Coupon",couponSchema)