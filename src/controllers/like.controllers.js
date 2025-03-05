import mongoose, {isValidObjectId} from "mongoose";
import {Like} from "../models/like.model.js";
import {Video} from "../models/video.models.js";
import {Comment} from "../models/comment.models.js";
import {User} from "../models/user.models.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    const userId = req.user._id; // assuming user is already authenticated
    if (!userId) {
        throw new ApiError(404, "User id not found")
    }

    // check if the video exists
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    // Check if the user already liked the video
    const existingLike = await Like.findOne({
        likedBy: userId,
        video: videoId
    });

    if (existingLike) {
        // if already liked, remove the like
        await Like.findByIdAndDelete(existingLike._id);
        return res
            .status(200)
            .json(
                new ApiResponse(200, null, "Like removed")
            )
    } else {
        // if not liked, add a new like
        const newLike = new Like({
            likedBy: userId,
            video: videoId
        });
        await newLike.save();
        return res.
            status(201)
            .json(
                new ApiResponse(200, null, "Like Added")
            )
    }

});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    const userId = await req.user._id; // assuming user is authenticated
    if (!userId) {
        throw new ApiError(404, "user id not found")
    }
    // check if the comment exists
    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }

    // check if the user already liked this video
    const existingLike = await Like.findOne({
        likedBy: userId,
        comment: commentId
    })

    if (existingLike) {
        // if already liked, remove the like
        await Like.findByIdAndDelete(existingLike._id);

        return res
            .status(200)
            .json(
                new ApiResponse(200, "Like removed successfully!")
            )
    } else {
        // if not liked, add a new like
        const newLike = new Like({
            likedBy: userId,
            vidoe: videoId
        });
        await newLike.save();

        return res
            .status(201)
            .json(
                new ApiResponse(200, null, "Like added successfully!")
            )
    }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    const userId = req.user._id
    if (!userId) {
        throw new ApiError(404, "User id not found")
    }
    // check tweeter id is found or not found
    if (!tweetId) {
        throw new ApiError(404, "tweet id not found")
    }

    const existingLike = await Like.findOne({
        likedBy: userId,
        video: video
    });
    if (existingLike) {
        // if already liked, remove the like
        await Like.findByIdAndDelete(existingLike._id)
        return res
            .status(200)
            .json(
                new ApiResponse(200, null, "Tweet Like removed Successfully!")
            )
    } else {
        // create a new like
        const newLike = new Like({
            likedBy: userId,
            video: video
        })
        await newLike.save();

        return res
            .status(201)
            .json(
                new ApiResponse(200, null, "Tweet Liked Successfully!")
            )
    }

});

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId = new mongoose.Types.ObjectId(req.user._id);

    // join likes with videos where likedBy is equal to userId
    // first step match userId in likes model
    // 2nd step now use these results to get the videos liked by user
    // by joining likes table to videos table
    // where foreign key would be _id in videos table

    const likedVideos = await Like.aggregate([
        
        {
            $match: {
                likedBy: userId
            }
        },
        {
            $lookup:{
                from: "vidoes",  // join with the videos collection
                localField: "video", // local field of likes model
                foreignField: "_id", // _id from videos model
                as: "likedVideos",
            }
        },
        {
            $unwind: "$likedVideos" // Flatten the array to object
        },
        {
            $project: {
                _id: 0, // Hide id from like model?
                "likedVideos._id": 1,
                "likedVideos.title": 1,
                "likedVideos.thumbnail": 1,
                "likedVideos.duration": 1,
                "likedVideos.views": 1,
                "likedVideos.owner": 1,
                "likedVideos.createdAt": 1

            }
        }
    ])
return res
    .status(200)
    .json(
        new ApiResponse(200, {
            likedVideos: likedVideos, // array of liked videos
            likedVideosCount: likedVideos.length // total number of liked videos
        }, 
        "Liked videos extracted Successfully!"
    )
    )     
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}