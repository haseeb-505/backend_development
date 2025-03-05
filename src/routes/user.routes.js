import {Router} from 'express';
import { registerUser,
        loginUser,
        logoutUser,
        refreshAccessToken,
        updatePassword,
        getCurrentUser,
        updateAccountDetails,
        updateUserAvatar,
        updateCoverImage,
        getUserChannelProfile,
        getWatchHistory 
} from '../controllers/user.controllers.js';
import {upload} from '../middlewares/multer.middleware.js';

import { verifyJWT } from '../middlewares/auth.middleware.js';


const router = Router();
// injecting the upload middleware before implementing the registerUser controller
router.route("/register").post(
    upload.fields([
        // since we are uploading two objects here, cover image and avatar
        // that's why we need two object
        {
            name: "avatar", 
            maxCount: 1
        },
        {
            name: "coverImage", 
            maxCount: 1
        }
    ]),
    registerUser
)

router.route("/login").post(loginUser)

// secured routes
router.route("/logout").post(verifyJWT, logoutUser) 
// verfiyJWT will first run the authorization and then pass to the next
// middleware which is logoutUser

router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT, updatePassword)
router.route("/current-user").get(verifyJWT, getCurrentUser) // since we are not posting any data
router.route("/update-account").patch(verifyJWT, updateAccountDetails)
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateCoverImage)
// channel name
router.route("/c/:username").get(verifyJWT, getUserChannelProfile)
router.route("/history").get(verifyJWT, getWatchHistory)




export default router;