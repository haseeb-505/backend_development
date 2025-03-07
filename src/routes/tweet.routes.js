import { Router } from "express";
import {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
} from "../controllers/tweet.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// since all tweet actions need authorized user
// so we inject verifyJWT middleware
router.use(verifyJWT); // secure routes

// now add all routes for tweets
router.route("/")
        .post(createTweet);

// get all the tweet of a certain user
router.route("/user/:userId")
        .get(getUserTweets);

// update or delete a certain tweet 
router.route("/tweet/:tweetId")
        .patch(updateTweet)
        .delete(deleteTweet);





