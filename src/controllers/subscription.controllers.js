import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.models.js"
import { Subscription } from "../models/subscription.models.js"
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
    const {channelId} = req.params;

    // validate channelId
    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(404, "Invald Channel ID")
    }

    // check if the channel (user) exists
    const channel = await User.findById(channelId);
    if (!channel) {
        throw new ApiError(404, "Channel does not exist with this ID")
    }

    // find subcribers from the subscription schema
    const subscribers = await Subscription.find({ channel: channelId })
                                        .populate("subscriber", "username fullName avatar") // add username, fullName etc to subscriber
                                        // or say populates the subscriber field with this information
                                        .select("subscriber createdAt") // this is the selection of the fields to extract
                                        .lean() // return plain javascript objects

    // send the response
    return res
        .status(200)
        .json(
            new ApiResponse(200, { subscribers: subscribers || [] }, "Subcribers fetched successfully!")
        )

})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;
    // subscriberId is the id of the user whose subscription list is to be fetched
    const userId = req.user._id;

    // check if the subscriber exists
    const subscriber = await User.findById(subscriberId);
    if (!subscriber) {
        throw new ApiError(404, "Subscriber not found")
    }

    // ensure the authenticated user is fetching the list
    if (subscriberId.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not authorized to get subscribed channel list")
    }

    // validate the subscriberId
    if (!mongoose.Types.ObjectId.isValid(subscriberId)) {
        throw new ApiError(400, "Invaild subscriber ID")
    }

    // find channels the user has subscribed to
    const subscribedChannel = await Subscription.find({ subscriber: subscriberId })
                                            .populate("channel", "username fullName avatar")
                                            .select("channel createdAt")
    
    return res
        .status(200)
        .json(
            new ApiResponse(200, { subscribedChannel: subscribedChannel || [] }, "Subscribed channel fetched Successfully!")
        )

})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}