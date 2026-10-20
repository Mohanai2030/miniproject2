import express from "express";
import { createTrip, getAvailableTrips, editTrip, deleteTrip, myTrips, myTripRequesterVisibilityList } from "../controllers/tripController.js";
import { verifyAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", verifyAuth, createTrip);
router.get("/", verifyAuth, getAvailableTrips);
router.get("/my",verifyAuth, myTrips);
router.get("/my/visibilitylist",verifyAuth, myTripRequesterVisibilityList);
router.put("/:id", verifyAuth, editTrip);
router.delete("/:id", verifyAuth, deleteTrip);

export default router;
