import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import { ApiError, ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Video } from "../models/video.model.js";
import { Like } from "../models/like.model.js";

const getChannelStats = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    // Find user
    const user = await User.findById(userId).select("username fullName avatar");
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Get total subscribers (count subscriptions where channel = userId)
    const totalSubscribers = await Subscription.countDocuments({ channel: userId });

    // Get all videos by the user
    const videos = await Video.find({ owner: userId }).populate({
        path: "owner",
        select: "username fullName avatar",
    });

    // Compute total videos, views, and likes
    let totalVideos = videos.length;
    let totalViews = videos.reduce((sum, video) => sum + (video.views || 0), 0);

    // Get total likes for all videos
    const videoIds = videos.map((video) => video._id);
    const totalLikes = await Like.countDocuments({ video: { $in: videoIds } });

    // Prepare response data
    const channelStats = {
        channel: userId,
        username: user.username,
        fullName: user.fullName,
        avatar: user.avatar,
        totalSubscribers,
        totalVideos,
        totalViews,
        totalLikes,
    };

    // Return response
    return res.status(200).json(new ApiResponse(200, channelStats, "Channel stats fetched successfully!"));
});

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const userId = req.user?._id;
    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(404, "User not found")
    }

    const allVideos = await Video.findById({ owner: userId})
                                .populate("owner", "_id username fullName avatar")
                                .sort({ createdAt: -1 })
                                .lean();

    // Handle case when no videos are found
    if (allVideos.length === 0) {
        return res.status(200).json(
            new ApiResponse(200, [], "No videos found for this channel.")
        );
    }
    
    // Send response
    return res.status(200).json(new ApiResponse(200, allVideos, "Channel videos fetched successfully!"));
});

export {
    getChannelStats, 
    getChannelVideos
}