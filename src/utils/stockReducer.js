import { Product } from "../models/product.model.js";
import { ApiError } from "./ApiError.js";

const reduceStock = async(orderItems) => {
  for(let i = 0;orderItems.length;i++){
     const order  = orderItems[i]
     console.log(order)
    //  if(!product){
    //   throw new ApiError(
    //     404,
    //     "Product not found while reducing stock"
    //   )
    // }

    // product.stock-=order.quantity;
    // await product.save()
  }
}

export {reduceStock}