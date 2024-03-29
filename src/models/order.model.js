import mongoose,{Schema} from "mongoose";

const orderSchema = new Schema(
  {
    shippingInfo : {
      address : {
        type : String,
        required : true
      },
      city : {
        type : String,
        required : true
      },
      state : {
        type : String,
        required : true
      },
      country : {
        type : String,
        required : true
      },
      pinCode : {
        type : String, //it should be not number bcz some countries contains char in their pinCode
        required : true
      }
    },

    user : {
      type : Schema.Types.ObjectId,
      ref  : "User",
      required : true,
    },

    subTotal : {
      type : Number,
      required : true
    },

    tax : {
      type : Number,
      required : true
    },

    shippingCharges : {
      type : Number,
      required : true
    },

    discount : {
      type : Number,
      required : true
    },

    total : {
      type : Number,
      required : true
    },

    status : {
      type : String,
      enum : ["Processing","Shipped","Delivered"],
      default : "Processing",
    },

    orderItems : [
      {
        name : String,
        photo : String, //cloudinaryURL
        price : Number,
        quantity: Number,
        productId : {
          type : mongoose.Types.ObjectId,
          ref  : "Product",
        }
      }
    ]
  },
  
  {
    timestamps : true,
  }
)

export const Order = mongoose.model("Order",orderSchema);