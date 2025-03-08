import { Router } from "express";
import {
    getChannelStats, 
    getChannelVideos
} from "../controllers/dashboard.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Secure all routes with JWT authentication
router.use(verifyJWT);

router.route("/channel/:channelId/stats")
    .get(getChannelStats);

router.route("/channel/:channelId/videos")
    .get(getChannelVideos);

export default router;
