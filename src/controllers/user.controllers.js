import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js';
import {User} from '../models/user.models.js';
import {uploadToCloudinary} from '../utils/cloudinary.js';
import {ApiResponse} from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';

const generateAccessRefreshToken = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()

        // save the refresh token in db
        user.refreshToken = refreshToken;
        // when we save the user, the password will be hashed again so it will again ask for password validation,
        // so we use validate before save to false
        await user.save({validateBeforeSave: false})

        return {accessToken, refreshToken}

    } catch (error) {
        console.error("Token generation error:", error);
        throw new ApiError(500, "Token generation failed, server failure")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    // validation whether username or email is empty, 
    // // or email is in correct format
    // check  if user already exists (unique email and username)
    // check for images
    // check for avatar
    // upload to cloudinary
    // check for avatar on cloudinary
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return response

    // user details
    const { username, email, fullName, password } = req.body
    // console.log(username, email, fullName, password);

    // valication - empty fields

    // if (fullName === "" || email === "" || username === "" || password === "") {
    //     throw new ApiError(400, "Please fill all the fields")     
    // }

    if (
        [fullName, email, username, password].some( (field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "Please fill all the fields")
    }
    
    // validation - email format

    // user already exists?
    const existedUser = await User.findOne({
        // to chekc for more than one fields
        $or: [{username}, {email}]
    })
    
    if (existedUser) {
        throw new ApiError(409, "User email/username already exists")
    }

    // check for avatar anf get its path
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // console.log("\n\n req.files has the following information\n", req.files);
    // cover image check
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    // check if avatar uploaded successfully
    if (!avatarLocalPath) {
        throw new ApiError(400, "Please upload an avatar")
    }

    // upload to cloudinary, wait for upload to complete
    const avatar = await uploadToCloudinary(avatarLocalPath)
    const coverImage = await uploadToCloudinary(coverImageLocalPath)

    // check for avatar on cloudinary
    if (!avatar) {
        throw new ApiError(400, "Avatar needs to be uploaded on cloudinary")
    }

    // console.log("Url of avatar uploaded on cloudinary: ", avatar)
    // see avatar is already in the form of url

    // create object and save in db
    const user = await User.create({
        username: username.toLowerCase(),
        email,
        fullName,
        avatar,
        // avatar: avatar.url, is not serving the purpose

        // check if cover image is available and then extract the url
        // if not available, then assign an empty string
        coverImage: coverImage || "",
        password
    })

    // remove password and refresh token field from response
    const createdUser = await User.findById(user._id).select("-password -refreshToken")
    
    // check user creation
    if (!user) {
        throw new ApiError(500, "User could not be created")
    }
    
    // return response
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User created successfully")
    )
});

// user login
const loginUser = asyncHandler(async (req, res) => {
    // req body -> data(username, email, password, etc)
    // username or email,
    // check if username or email is registered in your db (find the user)
    // check password
    // generate access token and refresh token
    // send token to secure cookies
    const {email, username, password} = req.body

    if (!username && !email) {
        throw new ApiError(400, "Please provide username or email")
    }

    // if (!(username || !mail)) {
    //     throw new ApiError(400, "Please provide username or email")
    // }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if (!user) {
        throw new ApiError(401, "user does not exist")  
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
    }

    // generate access token and refresh token
    const {accessToken, refreshToken} = await generateAccessRefreshToken(user._id)

    if (!accessToken || !refreshToken) {
        throw new ApiError(500, "Token generation failed");
    }

    // console.log("\nAccess token:", accessToken);
    // console.log("\nRefresh token:", refreshToken);

    // send token to secure cookies
    // we do not want to send the password and refresh token to the user
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    // send the cookie
    const options = {
        httpOnly: true, // to prevent xss attacks, cookies can only be modified by server. can be seen by browser but can't be modified
        secure: true, // only for https
        // sameSite: "none",
        // secure: process.env.NODE_ENV === "production" ? true : false
    }

    // console.log("Setting cookie:", accessToken);

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200, 
            // data field below
            {
                user: loggedInUser, accessToken, refreshToken
            },
            // message field below
            "User logged in successfully"
        )
    )
})

// user logout
const logoutUser = asyncHandler(async (req, res) => {
    // to get the user information, we can use User.findById(req.user._id)
    // but we do not have user_id from Userwith us,
    // we created user object by using User.findOne(userid:_id)
    // here we do not have direct access to db to get the user information
    // so we create a middle ware that will allow us to get this access to db
    // when we provide it with the access token
    // so we will create a middleware that will run before this function
    await User.findByIdAndUpdate( // find the user by id and update the refresh token to undefined
        req.user._id,
        { // update the refresh token to undefined to invalidate the token
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true // to get the updated value of refresh token we updated above
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200, null, "User logged out successfully")
    )

})

const refreshAccessToken = asyncHandler(async (req, res) => {
    // get the refresh token from the cookies
    // check if refresh token is valid
    // get the user from the refresh token
    // generate new access token
    // send the new access token

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Please login to continue") 
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        if (!decodedToken) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        const user = await User.findById(decodedToken?.id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        // match the refresh token in db with the incoming refresh token
        if (user?.refreshToken !== incomingRefreshToken) {
            throw new ApiError(401, "Refresh token is expired")
        }
    
        // generate new access token
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessRefreshToken(user._id)
    
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(200, 
                    {
                        accessToken, 
                        refreshToken: newRefreshToken
                    },
                     "Access token refreshed successfully")
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
        
    }
})

// password update function
const updatePassword = asyncHandler(async (req, re) => {
    // get the user from the db
    // check if the old password is correct
    // update the password
    // save the user without password validation, do not return the password
    // send the response

    const user = await User.findById(req.user._id)
}) 




// export the functions
export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
}

