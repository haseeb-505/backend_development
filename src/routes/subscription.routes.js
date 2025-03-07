import { Router } from "express";
import {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
} from "../controllers/subscription.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
// only authenticated user can do subscribe, unsubscribe, etc
router.use(verifyJWT);

router.route("/toggleSubscription")
        .post(toggleSubscription);

router.route("/channel/:channelId/subscribers")
        .get(getUserChannelSubscribers);

router.route("/user/:userId/subscriptions")
        .get(getSubscribedChannels);


export default router;