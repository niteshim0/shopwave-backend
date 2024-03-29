import { nodeCache } from "../app.js";

const invalidateCache = async ({product,order,admin,userId,productId,orderId}) => {
  if(product){
    const productKeys = ["categories","latest-products","all-products"]

    if(typeof productId === "string"){
      productKeys.push(`product-${productId}`)
    }

    if(typeof productId === "object"){
      productId.forEach(i => {
        productKeys.push(`product-${i}`)
      });
    }

    nodeCache.del(productKeys)
  }
  if(order){
    const orderKeys = [`order-${orderId}`, `my-orders-${userId}`,"all-orders"]
    nodeCache.del(orderKeys)
  }
  if(admin){
    nodeCache.del([
      "admin-stats",
      "admin-pie-charts",
      "admin-bar-charts",
      "admin-line-charts"
    ])
  }
}

export {invalidateCache}
