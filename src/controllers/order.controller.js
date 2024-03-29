import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Order } from "../models/order.model.js";
import { invalidateCache } from "../utils/cacheInvalidator.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { reduceStock } from "../utils/stockReducer.js";
import { app, nodeCache } from "../app.js";


const newOrder = asyncHandler(async (req, res,next) => {
  const { 
    shippingInfo,
    user,
    subTotal,
    tax,
    shippingCharges,
    discount,
    total,
    status,
    orderItems
  } = req.body;

  const fields = [shippingInfo, user, subTotal, tax, shippingCharges, discount, total, status, orderItems];

  for (let i = 0; i < fields.length; i++) {
    const field = fields[i];
    if (!field) {
      throw new ApiError(400, `All fields - ${field} are required`);
    }
  }

  const order = await Order.create({
    shippingInfo,
    user,
    subTotal,
    tax,
    shippingCharges,
    discount,
    total,
    status,
    orderItems
  });

  // Perform operations after order creation
  // TODO
  // IT will be shifted to while making payment
  // await reduceStock(orderItems);

  invalidateCache({
    product: true,
    order: true,
    admin: true,
    userId: user,
    productId: order.orderItems.map((i) => String(i.productId)),
  });

  return res
    .status(201)
    .json(
      new ApiResponse(
        200,
        order,
        "Order created successfully"
      )
    );
});


const myOrders = asyncHandler(async(req,res,next)=> {
   const {id : user} = req.query;

   //caching will be done using utlity after a while
   //TODO
   const key = `my-orders-${user}`
   let orders ;
   if(nodeCache.has(key)){
    orders = JSON.parse(nodeCache.get(key))
   }else{
    orders = await Order.find({user});
    if(!orders){
      throw new ApiError(
        404,
        "Order not found in myOrders"
      )
    }
    nodeCache.set(key,JSON.stringify(orders))
   }

   return res
   .status(200)
   .json(new ApiResponse(
    200,
    orders,
    "My Orders retrieved successfully"
   ))
})

const allOrders = asyncHandler(async(req,res,next)=>{
  const key = `all-orders`
  let orders;
  if(nodeCache.has(key)){
    orders = JSON.parse(nodeCache.get(key))
  }else{
    orders = await Order.find().populate("user","name email")
    if(!orders){
      throw new ApiError(
        404,
        "All order not found for adminOnly request in allOrders"
      )
    }

    nodeCache.set(key,JSON.stringify(orders))
  }

  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      orders,
      "All Orders is fetched successfully"
    )
  )

})

const getSingleOrder = asyncHandler(async(req,res,next) => {
   const {id} = req.params;
   const key = `order-${id}`
   let order;

   if(nodeCache.has(key)){
    order = JSON.parse(nodeCache.get(key))
   }else{
    order = await Order.findById(id).populate("user","name email")
    if(!order){
      throw new ApiError(
        404,
        "order is not found in getSingleOrder"
      )
    }
    nodeCache.set(key,JSON.stringify(order))
   }
  
   return res
   .status(200)
   .json(
    new ApiResponse(
      200,
      order,
      "single order is retrieved successfully"
    )
   )
})

const processOrder = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const order = await Order.findById(id);

  if (!order) {
    throw new ApiError(
      404,
      "Order does not exist, cannot process"
    );
  }

  switch (order.status) {
    case "Processing":
      order.status = "Shipped";
      break;

    case "Shipped":
      order.status = "Delivered";
      break;

    default:
      return res.status(200).json(
        new ApiResponse(
          200,
          "Order has been deliverd"
        )
      );
  }

  await order.save();

  invalidateCache({
    product: false,
    order: true,
    admin: true,
    userId: order.user,
    orderId: order._id,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      order,
      "Order processed successfully"
    )
  );
});


const deleteOrder = asyncHandler(async(req,res)=>{
  const {id} = req.params;
  console.log(id)
  const order = await Order.findById(id)
  console.log(order)
  if(!order){
    throw new ApiError(
      404,
      "if order does not exist how you will delete it"
    )
  }

  await order.deleteOne()

  invalidateCache({
    product: false,
    order: true,
    admin: true,
    userId: order.user,
    orderId: order._id,
  });

  return res
  .status(200)
  .json(
    new ApiResponse(
      204,
      {},
      "Order gets deleted"
    )
  )
})


export { newOrder ,myOrders ,allOrders ,getSingleOrder , processOrder ,deleteOrder};
