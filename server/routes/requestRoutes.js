import express from "express";
import { createRequest, getMyRequests, getOthersRequests, updateRequest, deleteRequest } from "../controllers/requestController.js";
import { verifyAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", verifyAuth, createRequest);
router.get("/my", verifyAuth, getMyRequests);
router.get("/others", verifyAuth, getOthersRequests);
router.put("/:id", verifyAuth, updateRequest);
router.delete("/:id", verifyAuth, deleteRequest);


export default router;
