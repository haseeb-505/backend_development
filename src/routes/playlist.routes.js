import { Router } from "express";
import {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
} from "../controllers/playlist.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
// secure the routes
router.use(verifyJWT);

router.route("/user/playlist")
        .post(createPlaylist)
        .get(getUserPlaylists);

router.route("/user/playlist/:playlistId")
        .get(getPlaylistById)
        .patch(updatePlaylist)
        .delete(deletePlaylist);

router.route("/user/playlist/:playlistId/video/:videoId")
        .post(addVideoToPlaylist)
        .delete(removeVideoFromPlaylist);
        

export default router;