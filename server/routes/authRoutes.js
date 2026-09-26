import express from "express";
import { signup, login, refresh, logout } from "../controllers/authController.js";
import { verifyAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", verifyAuth, logout);

export default router;
