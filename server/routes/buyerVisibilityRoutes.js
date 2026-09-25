import express from "express";
import { getBuyerVisibilityList, searchStudents, updateBuyerVisibilityList } from "../controllers/buyerVisibilityController.js";
import { verifyAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", verifyAuth, getBuyerVisibilityList);
router.get("/search", verifyAuth, searchStudents);
router.post("/", verifyAuth, updateBuyerVisibilityList);

export default router;
