import { Router } from "express";
import { createPlacesController } from "../controllers/places.controller.ts";
import { mapService } from "../services/index.ts";
import { rateLimiterMiddleware } from "../middlewares/rateLimiter.middleware.ts";

const { placesSearchApi, placesGeocodeApi, placesReverseGeocodeApi, calculateRoute } = createPlacesController(mapService);
const router = Router();

router.use(rateLimiterMiddleware)

router.get("/search", placesSearchApi);
router.get("/geocode", placesGeocodeApi);
router.get("/reverse-geocode", placesReverseGeocodeApi);
router.get("/route", calculateRoute);

export default router;
