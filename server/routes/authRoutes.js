import express from "express";
import { signup, login, refresh, logout, updateFcmToken } from "../controllers/authController.js";
import { verifyAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", verifyAuth, logout);
router.post("/fcm-token", verifyAuth, updateFcmToken);
router.put("/fcm-token", verifyAuth, updateFcmToken);

export default router;