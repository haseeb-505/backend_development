// 
import {ApiError} from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import {asyncHandler} from "../utils/asyncHandler.js";
import {User} from "../models/user.models.js";

// res is not used her so we can replace it with _;

export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accesToken || req.headers("Authorization")?.replace("Bearer ", "") 
        // token is usually in the form autorization: Beareer <token>
        // replace Bearer with empty string to get the token part only
        if (!token) {
            throw new ApiError(401, "Unauthorized request")
        }
    
        // verify the token against access token secret
        const decodedToken = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        console.log("decoded token has the following information", decodedToken)

        // The decodedToken will contain the payload that was originally signed when creating the JWT.
        // If _id was included in the payload during token generation, then decodedToken._id will be present.
        // access token was given everything in payload while refresh token was given only _id
        // due to this reason, we can use decodedToken._id to fetch the user from the database as we are doing below

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if (!user) {
            throw new ApiError(401, "Invalid access token")
        }
    
        req.user = user; // we are attaching the user to the request object 
        // so that it can be used in the next middleware or route handler which in our case will be logoutUser
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")  
    }

})

// add this middleware to the routes where you want to protect the routes
// for example, in user.routes.js