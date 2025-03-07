import { Router } from "express";
import {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
} from "../controllers/like.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlerware.js";

const router = Router();

// for likes, we need authenticated user
router.use(verifyJWT);

// Toggle like for a video
router.route("/video/:videoId/like").post(toggleVideoLike);

// Toggle like for a tweet
router.route("/tweet/:tweetId/like").post(toggleTweetLike);

// Toggle like for a comment
router.route("/comment/:commentId/like").post(toggleCommentLike);

// Get all liked videos of a user
router.route("/user/liked-videos").get(getLikedVideos);

export default router;