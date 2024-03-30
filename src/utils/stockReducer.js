import { Product } from "../models/product.model.js";
import { ApiError } from "./ApiError.js";

const reduceStock = async (orderItems) => {
  try {
    for (let i = 0; i < orderItems.length; i++) {
      const { productId, quantity } = orderItems[i];
      
      const product = await Product.findById(productId);
      
      if (product) {
        product.stock -= quantity;
        await product.save();
      } else {
        throw new ApiError(
          404,
          "Product not found while reducing stock"
        );
      }
    }
  } catch (error) {
    console.error('Error reducing stock:', error);
    throw new Error('Error reducing stock');
  }
};

export { reduceStock };
