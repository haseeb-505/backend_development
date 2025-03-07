import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadToCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "desc", userId } = req.query;

    // Convert `page` and `limit` to numbers (ensuring valid pagination)
    const pageNumber = Math.max(1, parseInt(page));
    const pageSize = Math.max(1, parseInt(limit));
    
    // Build the query filter
    const filter = {};

    // Search videos by title or description (case-insensitive)
    if (query) {
        filter.$or = [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } }
        ];
    }

    // Filter by user ID if provided
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
        filter.owner = userId;
    }

    // Sorting order (asc = 1, desc = -1)
    const sortOrder = sortType === "asc" ? 1 : -1;
    
    // Fetch videos with pagination and sorting
    const videos = await Video.find(filter)
        .populate("owner", "username fullName avatar") // Populate user details
        .select("title description thumbnail duration owner views isPublished createdAt")
        .sort({ [sortBy]: sortOrder }) // Dynamic sorting
        .skip((pageNumber - 1) * pageSize) // Skip previous pages
        .limit(pageSize); // Limit results per page

    // Count total matching videos (for pagination metadata)
    const totalVideos = await Video.countDocuments(filter);
    const totalPages = Math.ceil(totalVideos / pageSize);

    // Return response
    return res.status(200).json(
        new ApiResponse(200, { videos, page: pageNumber, totalPages, totalVideos }, "Videos fetched successfully")
    );
});

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video

    const userId = req.user._id;
    const videoLocalPath = req.file?.path;
    if (!videoLocalPath) {
        throw new ApiError(400, "Video file is missinig")
    }

    // validate if user exists
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found")
    }

    if (title?.trim().length === 0 || description?.trim().length === 0) {
        throw new ApiError(404, "Title or description can't be empty")
    }

    // upload the video file to cloudinary
    const video = await uploadToCloudinary(videoLocalPath);

    if (!video) {
        throw new ApiError(400, "video file could not be uploaded to cloudinary")
    }

    // * recommended is the following check
    // if (!video || !video.url) {
    //     throw new ApiError(400, "Video file could not be uploaded to Cloudinary");
    // }
    
    // comments
    const newVideo = new Video({
        title: title.trim(),
        description: description.trim(),
        videoFile: video.url || video,
        owner: userId,
        // duration: video.duration || 0 //* get this value from cloudinary
        // * in cloudinary, make sure to return the uploaded object not the simple url
        // * otherwise useful Information is lost
        isPublished: true
    })

    // save the newly created video in db
    await newVideo.save();

    // remove the local videoLocalPath
    fs.unlinkSync(videoLocalPath);
    // await fs.promises.unlink(videoLocalPath)

    return res
        .status(200)
        .json(
            new ApiResponse(200, newVideo, "Video is published Successfully")
        )
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    // videoId validation
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(404, "Video id not valid")
    } 

    // get the video
    const videoById = await Video.findById(videoId)
                            .populate("owner", "username fullName avatar")
                            .select("title description videoFile thumbnail duration owner views isPublished createdAt");
    
    // check if video exists
    if (!videoById) {
        throw new ApiError(404, "Video not found")
    }

    // restricting the access to private videos
    const isPublished = videoById.isPublished;
    const authorizedUser = videoById.owner && videoById.owner._id.toString() === req.user._id.toString();

    if (!isPublished && !authorizedUser) {
        throw new ApiError(403, "You are not authorized to see this video")
    }

    // return the response
    return res
        .status(200)
        .json(
            new ApiResponse(200, videoById, "Video for given id is fetched successfully")
        )
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    //TODO: update video details like title, description, thumbnail
    const { title, description } = req.body;
    const thumbnailLocalPath  = req.file?.path;

    // validate thumbnail
    if (!thumbnailLocalPath) {
        throw new ApiError(400, "thumbnail file missing")
    }

    const userId = req.user._id;

    // validate user against userId
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found")
    }

    // validate videoId
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    // validate title and description
    // if (title?.trim().length === 0 || description?.trim().length === 0 || !thumbnailLocalPath) {
    //     throw new ApiError(400, "one of title, description, thumbnail shall not be empty")
    // }
    // or
    if (title?.trim().length === 0 || description?.trim().length === 0) {
        throw new ApiError(400, "one of title or description shall not be empty")
    }

    // validate video against videoId
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    // check if user is authorized to delete the video
    if (video.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not authorized to make updates in this video")
    }

    // uplaod thumbnail to cloudinary
    const thumbnail = await uploadToCloudinary(thumbnailLocalPath);

    // make the updates
    const updateVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                thumbnail: thumbnail || thumbnail.url,
                title: title,
                description: description,
                updatedAt: { type: Date, default: Date.now }
            }
        },
        { new: true }
    )

    // return the response
    return res
        .status(200)
        .json(
            new ApiResponse(200, updateVideo, "video is updated successfully")
        )
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    const userId = req.user._id;

    // validate videoId
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    // validate user against userId
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found")
    }

    // validate video against videoId
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    // check if user is authorized to delete the video
    if (video.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "this user is not authorized to delete the video")
    }

    // TODOD: **Delete video from Cloudinary as well**
    //  if (video.videoFile) {
    //     const oldPublicId = video.videoFile.split('/').pop().split('.')[0]; // Extract public_id
    //     await cloudinary.uploader.destroy(oldPublicId); // Delete old image
    // }

    // now delete the video
    await Video.findByIdAndDelete(videoId);

    // retrun response
    return res
        .status(200)
        .json(
            new ApiResponse( 200, null, "Video is deleted Successfully!")
        )
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const userId = req.user._id;

    // validate videoId
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    // validate user against userId
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found")
    }

    // validate video against videoId
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    // check if user is authorized to delete the video
    if (video.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not authorized to change the publish status of this video")
    }

    // Toggle publish status
    video.isPublished = !video.isPublished;

    // update the isPublished to publishStatus value
    video.isPublished = publishStatus;
    // save it
    await video.save();

    // return the response
    return res
        .status(200)
        .json(
            new ApiResponse(200, video, "video publish status changed successfully")
        )
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}