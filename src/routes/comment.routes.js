import { Router } from "express";
import {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
} from "../controllers/comment.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
// inject verifyJWT middleware
router.use(verifyJWT);

router.route("/video/:videoId/comments")
        .get(getVideoComments)
        .post(addComment);

router.route("/video/:videoId/comments/:commentId")
        .patch(updateComment)
        .delete(deleteComment);

export default router;