import { Coupon } from "../models/coupon.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const newCoupon = asyncHandler(async(req,res,next)=> {
  const {code,amount} = req.body
  if(!code || !amount){
    throw new ApiError(
      403,
      "Please enter coupon code or its amount sir!"
    )
  }

  const coupon = await Coupon.create(
    {
      code,
      amount
  })

  return res
  .status(201)
  .json(
    new ApiResponse(
      201,
      coupon,
      "a new coupon is created"
    )
  )
})

const applyDiscount = asyncHandler(async(req,res,next)=>{
  const {code} = req.query

  const discount = await Coupon.findOne({code}).select("amount")

  if(!discount){
    throw new ApiError(
      403,
      "Invalid Coupon Code"
    )
  }

  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      discount.amount,
      "Discount is applied successfully"
    )
  )
})

const allCoupons = asyncHandler(async(req,res,next)=>{
   const coupons = await Coupon.find({})

   return res
   .status(200)
   .json(
    new ApiResponse(
      200,
      coupons,
      "All coupons are retrieved"
    )
   )
})

const deleteCoupon = asyncHandler(async(req,res,next)=>{
  const {id} = req.params;
  const coupon = await Coupon.findByIdAndDelete(id)

  if(!coupon){
    throw new ApiError(
      403,
      "Invalid Coupon Code"
    )
  }

  return res
  .status(200)
  .json(
    new ApiResponse(
      204,
      coupon.code,
      "This coupon code has been deleted"
    )
  )

   
})

export {newCoupon, applyDiscount, allCoupons ,deleteCoupon}