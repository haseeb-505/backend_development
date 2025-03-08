import mongoose from "mongoose"
import { User } from "../models/user.models.js"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video & views, total subscribers, total likes etc.
    const channelId = req.body;
    const channel = await Subscription.findById(channelId);
    if (!channel) {
        throw new ApiError(404, "Channel not found")
    }

    const channelStats = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId), // Match the channel by userId
            },
        },
        // Lookup for subscribers
        {
            $lookup: {
                from: "users",
                localField: "subscriber", // Ensure this matches your Subscription schema
                foreignField: "_id",
                as: "subscribersInfo",
            },
        },
        // Lookup for videos
        {
            $lookup: {
                from: "videos",
                localField: "channel", // Ensure this matches your Subscription schema
                foreignField: "owner",
                as: "channelVideoInfo",
                pipeline: [
                    // Lookup for video likes
                    {
                        $lookup: {
                            from: "likes",
                            localField: "_id",
                            foreignField: "video",
                            as: "videoLikeInfo",
                        },
                    },
                    // Add totalLikes field to each video
                    {
                        $addFields: {
                            totalLikes: { $size: "$videoLikeInfo" },
                        },
                    },
                ],
            },
        },
        // Unwind channelVideoInfo to compute totals
        {
            $unwind: {
                path: "$channelVideoInfo",
                preserveNullAndEmptyArrays: true, // Preserve channels with no videos
            },
        },
        // Group to compute totals
        {
            $group: {
                _id: "$channel", // Group by channel
                totalSubscribers: { $sum: 1 }, // Count the number of subscribers
                totalVideos: { $sum: 1 }, // Count the number of videos
                totalViews: { $sum: "$channelVideoInfo.views" }, // Sum all views
                totalLikes: { $sum: "$channelVideoInfo.totalLikes" }, // Sum totalLikes from all videos
            },
        },
        // Project only necessary fields
        {
            $project: {
                _id: 0,
                totalSubscribers: 1,
                totalVideos: 1,
                totalViews: 1,
                totalLikes: 1,
            },
        },
    ]);

    // Handle case where no stats are found
    if (!channelStats.length) {
        return res.status(200).json(
            new ApiResponse(200, {
                totalSubscribers: 0,
                totalVideos: 0,
                totalViews: 0,
                totalLikes: 0,
            }, "Channel stats fetched successfully (no data found)")
        );
    }

    // Return the response
    return res.status(200).json(
        new ApiResponse(200, channelStats[0], "Channel stats fetched successfully!")
    );
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