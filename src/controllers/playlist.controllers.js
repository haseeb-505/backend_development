import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body;
    //TODO: create playlist

     // Validate name and description
     if (!name || name.trim() === "" || !description || description.trim() === "") {
        throw new ApiError(400, "Both name and description are required");
    }

    const userId = req.user._id;
    
    // find the user with this id
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User with this id not found")
    }

    const playlist = new Playlist({
        name: name.trim(),
        description: description.trim(),
        owner: userId
    });

    // save the playlist
    await playlist.save();

    return res
        .status(200)
        .json(
            new ApiError(201, "playlist created successfully")
        )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists

    // Get pagination parameters from query (default: page 1, limit 10)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const userPlaylists = await Playlist.aggregate([
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
                as: "playlistsOwnerDetails"
            }
        },
        {
            $unwind: "$playlistsOwnerDetails"
        },
        {
            $project: {
                _id: 1,
                videos: 1,
                name: 1,
                description: 1,
                createdAt: 1,
                "playlistsOwnerDetails.username": 1,
                "playlistsOwnerDetails.fullName": 1,
                "playlistsOwnerDetails.avatar": 1
            }
        },
        {
            $sort: { createdAt: -1 }, // sorting the tweets by newest first
        },
        // pagination
        { $skip: skip },
        { $limit: limit }
    ])
    // get the count of total playlists and total pages
    const totalPlaylists = await Playlist.countDocuments({
        owner: new mongoose.Types.ObjectId(userId)
    });

    const totalPages = Math.ceil(totalPlaylists / limit);

    return res
        .status(200)
        .json(
            new ApiResponse(200, {
                playlists: userPlaylists,
                pagination: {
                    page,
                    limit,
                    totalPlaylists,
                    totalPages
                }
            },
            "User Playlists fetched successfully")
        )
});


const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id

    const playlist = await Playlist.findById(playlistId)
                                    .populate("owner", "username fullName avatar")
                                    .populate("videos", "title thumbnail videoFile")
                                    .select("name description owner videos");
    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    if (playlist.videos.length === 0) {
        throw new ApiError(404, "No videos in playlist")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, {playlist: playlist }, "Playlist fetched successfully!")
        )
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist

    const userId = req.user._id;

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found for this playlistId")
    }
    
    // now check if the current user is authorized to make changes in this playlist
    if (userId.toString() !== playlist.owner.toString()) {
        throw new ApiError(403, "User is not authorized to remove video from playlist")
    }

    // check for video's existence
    
    if (!playlist.videos.includes(videoId)) {
        throw new  ApiError(404, "Video not found in this playlist")
    }

    // now find the video and delete it
    await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: {
                videos: videoId
            }
        },
        { new: true }
    );
    
    // return the response
    return res
        .status(200)
        .json(
            new ApiResponse(200, null, "Successfully removed the video from playlist")
        )
});

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist

    const userId = req.user._id;

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "No playlist found with this id");
    }

    // user authorization check
    if (playlist.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "User is not authorized to delete the playlist");
    }

    await Playlist.findByIdAndDelete(playlistId);

    // return response
    return res
        .status(200)
        .json(
            new ApiResponse(200, null, "Playlist deleted Successfully!")
        )
});

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist

    const userId = req.user._id;

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "No playlist found")
    }

    // check for user authorization
    if (playlist.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "Current user is not authorized to update the playlist")
    }

    // validate the name and description,
    // and update them
    const updates = {};
    if (name !== undefined && name.trim() !== "") {
        updates.name = name.trim();
    }
    if (description !== undefined && description.trim() !== "") {
        updates.description = description.trim();
    }

    // Check if at least one field is being updated
    if (Object.keys(updates).length === 0) {
        throw new ApiError(400, "At least one field (name or description) must be provided for update");
    }

    // update the playlist
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        { $set: updates },
        { new: true } // Return the new updated document
    )

    // return the response
    return res 
        .status(200)
        .json(
            new ApiResponse(200, updatedPlaylist, "Playlist updated Successfully")
        )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}