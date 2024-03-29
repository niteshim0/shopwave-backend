import { stripe } from "../app.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const createStripePaymentIntent = asyncHandler(async (req, res, next) => {
  const { amount } = req.body


  
  if (!amount) {
    throw new ApiError(400, "Amount is required for payment")
  }
  if(isNaN(Number(amount))){
    throw new ApiError(400, "Amount should be a number")
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Number(amount) * 100, 
    currency: "inr",
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      { clientSecret: paymentIntent.client_secret },
      "Stripe payment initiated successfully"
    )
  )
});
export {createStripePaymentIntent}
