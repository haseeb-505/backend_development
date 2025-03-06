import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    const userId = req.user._id;
    if (!userId) {
        throw new ApiError(404, "user id not found")
    }

    if (!channelId) {
        throw new ApiError(404, "Channel id not found in params")
    }

    // check if the channel (user) exists
    const channel = await User.findById(channelId);
    if (!channel) {
        throw new ApiError(404, "Channel doesn't exist")
    }

    // check if user is already subscribed
    const existingSubscription = await Subscription.findOne({
        subscriber: userId,
        channel: channelId
    })

    if (existingSubscription) {
        await Subscription.deleteOne({ _id: existingSubscription._id });
        return res
            .status(200)
            .json(
                new ApiResponse(200, null, "subscription removed successfully!")
            )
    } else {
        const newSubscription = new Subscription({
            subscriber: userId,
            channel: channelId
        });
        await newSubscription.save()
        
        return res
            .status(200)
            .json(
                new ApiResponse(200, null, "Subscription added Successfully!")
            )
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}