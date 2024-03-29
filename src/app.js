import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import NodeCache from "node-cache";
import Stripe from "stripe";
import { ApiError } from "./utils/ApiError.js";

const nodeCache  = new NodeCache()
const stripeKey = process.env.STRIPE_KEY || ""
const stripe = new Stripe(stripeKey)
const app = express()

app.use(cors({
  origin:process.env.CORS_ORIGIN,
}))

app.use(express.json({limt:"16kb"}))

app.use(express.urlencoded({extended:true,limit:"16kb"}))

app.use(express.static("public"))

app.use(cookieParser())






//routes import
import userRouter from "./routes/user.route.js";
import proudctRouter from "./routes/product.route.js";
import orderRouter from "./routes/order.route.js";
import couponRouter from "./routes/coupon.route.js"
import dashboardRouter from "./routes/dashboard.route.js"
import paymenRouter from "./routes/payment.route.js"


 //routes declaration
app.use("/api/v1/users",userRouter);
app.use("/api/v1/products",proudctRouter);
app.use("/api/v1/orders",orderRouter);
app.use("/api/v1/coupons",couponRouter);
app.use("/api/v1/payments",paymenRouter);
app.use("/api/v1/dashboard",dashboardRouter);

export {app , nodeCache ,stripe}

