import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // validate videoId
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }
    
    
    const videoComments = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "commentUserDetails"
            }
        },
        {
            $unwind: "$commentUserDetails"
        },
        {
            $project: {
                _id: 1,
                content: 1,
                createdAt: 1,
                owner: 1,
                "commentUserDetails.username": 1,
                "commentUserDetails.fullName": 1,
                "commentUserDetails.avatar": 1
            }
        },
        {
            $sort: { createdAt: -1 }, // sorting the tweets by newest first
        },
        // pagination
        { $skip: skip },
        { $limit: limit }
    ])

    // total comments, total pages
    const totalComments = await Comment.countDocuments({
        video: videoId
    });
    const totalPages = Math.ceil(totalComments / limit)

    // return the response
    return res
        .status(200)
        .json(
            new ApiResponse(200, 
                {
                    videoComments,
                    pagination: {
                        page,
                        limit,
                        totalComments,
                        totalPages
                    }
                },
                "Comment fetched successfully"
            )
        )
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {content} = req.body;
    const {videoId} = req.params;
    const userId = req.user._id;

    // validate the userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(404, "User id is not valid")
    }

    // validate the videoId
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(404, "Video id is not valid")
    }

    // validate the content
    if (content?.trim().length === 0) {
        throw new ApiError(400, "Comment can't be empty")
    }

    // ensure the user's existence with this userId
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found")
    }

    // Ensure the video exists
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // create the comment
    const comment = new Comment({
        content: content,
        owner: userId,
        video: videoId
    });

    // save the comment
    await comment.save();

    // return the response
    return res
        .status(200)
        .json(
            new ApiResponse(200, comment, "Comment added successfully")
        )
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { commentId } = req.params;
    const userId = req.user._id;
    const { content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }    

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment does not exist anymore")
    }

    if (comment.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not authorized to update the comment")
    }

    // validate the content
    if(!content || content.trim().length === 0){
        throw new ApiError(400, "comment can't be empty")
    }

    // update the tweet
    comment.content = content.trim();
    await comment.save();

    return res
        .status(200)
        .json(
            new ApiResponse(200, comment, "comment updated successfully!")
        )
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId, videoId} = req.params;
    const userId = req.user._id;

    // validate commentId
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }
    
    // check if comment exists
    const comment = await Comment.findOne({ _id: commentId, video: videoId });
    if (!comment) {
        throw new ApiError(404, "Comment does not exist")
    }

    // Ensure the video exists
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // only the comment owner or video owner can delete the comment
    // Check if the current user is authorized to delete the comment
    const isCommentOwner = comment.owner.toString() === userId.toString();
    const isVideoOwner = video.owner.toString() === userId.toString();
    
    if (!isCommentOwner && !isVideoOwner) {
        throw new ApiError(403, "You are not authorized to delete the comment")
    }

    // delete the comment
    await await Comment.findOneAndDelete({ _id: commentId, video: videoId });

    // return the response
    return res
        .status(200)
        .json(
            new ApiResponse(200, null, "Comment deleted successfully")
        )
});

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }