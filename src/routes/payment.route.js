import { Router } from "express";
import { createStripePaymentIntent } from "../controllers/payment.controller.js";


const router = Router()

router.route("/create").post(createStripePaymentIntent)


export default router