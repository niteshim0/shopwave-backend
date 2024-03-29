import {Router} from "express";
import { allCoupons, applyDiscount, deleteCoupon, newCoupon } from "../controllers/coupon.controller.js";
import { adminOnly } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/new").post(adminOnly,newCoupon)
router.route("/discount").get(applyDiscount)
router.route("/all-coupons").get(adminOnly,allCoupons)
router.route("/:id").delete(adminOnly,deleteCoupon)




export default router;