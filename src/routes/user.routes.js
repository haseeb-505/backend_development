import {Router} from 'express';
import { registerUser } from '../controllers/user.controllers.js';
import {upload} from '../middlewares/multer.middleware.js';
import { loginUser } from '../controllers/user.controllers.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { logoutUser } from '../controllers/user.controllers.js';

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

export default router;