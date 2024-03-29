import {Router} from "express";
import { getBarCharts, getDashboardStats, getLineCharts, getPieCharts } from "../controllers/dashboard.controller.js";
import { adminOnly } from "../middlewares/auth.middleware.js";


const router = Router()

router.route("/stats").get(adminOnly,getDashboardStats)
router.route("/pie").get(adminOnly,getPieCharts)
router.route("/bar").get(adminOnly,getBarCharts)
router.route("/line").get(adminOnly,getLineCharts)

export default router;