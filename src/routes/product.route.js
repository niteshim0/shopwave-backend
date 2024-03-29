import { Router } from "express";
import { adminOnly } from "../middlewares/auth.middleware.js";
import {  deleteProduct, getAdminProducts, getAllCategories, getAllProducts,  getLatestProducts, getSingleProduct, newProduct, updateProduct } from "../controllers/product.controller.js";
import { singleUpload } from "../middlewares/multer.middleware.js";

const router = Router()

router.route("/new").post(adminOnly, singleUpload , newProduct)
router.route("/latest").get(getLatestProducts)
router.route("/categories").get(getAllCategories)
router.route("/all").get(getAllProducts)
router.route("/admin-products").get(adminOnly,getAdminProducts)
router
.route("/:id")
.get(getSingleProduct)
.put(adminOnly,singleUpload,updateProduct)
.delete(adminOnly,deleteProduct)



export default router;