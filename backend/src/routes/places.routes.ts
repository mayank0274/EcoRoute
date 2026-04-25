import { Router } from "express";
import { createPlacesController } from "../controllers/places.controller.ts";
import { mapService } from "../services/index.ts";

const router = Router();
const { placesSearchApi, placesGeocodeApi, placesReverseGeocodeApi, calculateRoute } = createPlacesController(mapService);

router.get("/search", placesSearchApi);
router.get("/geocode", placesGeocodeApi);
router.get("/reverse-geocode", placesReverseGeocodeApi);
router.get("/route", calculateRoute);

export default router;
