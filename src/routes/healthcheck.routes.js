import { Router } from "express";
import { healthcheck } from "../controllers/healthcheck.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Public health check route (does NOT require authentication)
router.route("/healthcheck").get(healthcheck);

// Secure all other routes
router.use(verifyJWT);

export default router;
