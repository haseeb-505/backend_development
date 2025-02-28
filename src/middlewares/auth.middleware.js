// 
import {ApiError} from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import {asyncHandler} from "../utils/asyncHandler.js";
import {User} from "../models/user.models.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies?.accesToken || req.headers("Authorization")?.replace("Bearer ", "")
        if (!token) {
            throw new ApiError(401, "Unauthorized request")
        }
    
        // verify the token against access token secret
        const decodedToken = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        // fetch the user from the database and then check if it is found or not
        const user = await User.findById(decodedToken._id).select("-password -refreshToken")
    
        if (!user) {
            throw new ApiError(401, "Invalid access token")
            
        }
    
        req.user = user;
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
        
    }

})

// add this middleware to the routes where you want to protect the routes
// for example, in user.routes.js