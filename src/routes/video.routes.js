import { Router } from "express";
import {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
} from "../controllers/video.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js"; 

const router = Router();
// since we need a logged in user to perform 
// perform all the above functions about videos
// so we need to verify if user is logged in
// so we immediately inject verifyJWT from auth.middlerware.js 
// before establishing any route at all

router.use(verifyJWT); // all routes after this are secured now

// get all videos
router.route("/")
        .get(getAllVideos)
        .post(
                upload.fields([
                    {
                        name: "videoFile",
                        maxCount: 1,
                    },
                    {
                        name: "thumbnail",
                        maxCount: 1,
                    },
                ]),
                publishAVideo
            );

// get video by id
router.route("/:videoId")
        .get(getVideoById) // get videos by id
        .delete(deleteVideo) // delete video with this id
        .patch(upload.single("thumbnail"), updateVideo); // inject upload middleware, update the videos

// update the video publish status
router.route("/toggle/publish/:videoId")
        .patch(togglePublishStatus);

export default router
