import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.models.js"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content} = req.body;
    const userId = req.user._id;

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Tweet content required")
    }

    // ensure the user's existence with this userId
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found")
    }

    // create a new tweet with this content
    const tweet = new Tweet({
        owner: userId,
        content: content.trim()
    })
    // save the tweet to the database
    await tweet.save();

    return res
        .status(200)
        .json(
            new ApiResponse(202, tweet, "Tweet created Successfully!")
        )
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const userId = req.user._id;

    if (!userId) {
        throw new ApiError(400, "User ID is required");
    }

    // Get pagination parameters from query (default: page 1, limit 10)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const userTweets = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails"
            }
        },
        {
            $unwind: "$ownerDetails"
        },
        {
            $project: {
                _id: 1, // tweet id
                content: 1,
                createdAt: 1,
                "ownerDetails.username": 1,
                "ownerDetails.fullName": 1,
                "ownerDetails.avatar": 1
            }
        },
        {
            $sort: { createdAt: -1 }, // sorting the tweets by newest first
        },
        // pagination
        { $skip: skip },
        { $limit: limit }
    ]);

    // get the count of total tweets
    const totalTweets = await Tweet.countDocuments({
        owner: userId
    });
    const totalPages = Math.ceil(totalTweets / limit);

    // return the response
    return res
        .status(200)
        .json(
            new ApiResponse(200, 
                {
                    tweets: userTweets,
                    pagination: {
                            page,
                            limit,
                            totalTweets,
                            totalPages
                    }
                }, 
                "User tweets fetched Successfully!")
        )
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { tweetId } = req.params;
    const userId = req.user._id;
    const { content } = req.body;

    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(404, "Tweet does not exist anymore")
    }

    if (tweet.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not authorized to update the tweet")
    }

    // validate the content
    if(!content || content.trim().length === 0){
        throw new ApiError(400, "Tweet can't be empty")
    }

    // update the tweet
    tweet.content = content.trim();
    await tweet.save();

    return res
        .status(200)
        .json(
            new ApiResponse(200, tweet, "Tweet updated successfully!")
        )
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params;
    const userId = req.use._id;

    const tweet = await Tweet.findOne(tweetId);
    if (!tweet) {
        throw new ApiError(404, "Tweet does not exist")
    }

    // ensure only the owner can delete
    if (tweet.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not authorized to delete this tweet")
    }

    // delete the tweet
    await Tweet.findByIdAndDelete(tweetId);

    return res
        .status(200)
        .json(
            new ApiResponse(200, null, "Tweet deleted Successfully!")
        )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}

