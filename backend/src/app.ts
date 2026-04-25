import express from "express";
import morgan from "morgan";
import { errorHandlerMiddeware } from "./middlewares/errorHandler.middleware.ts";
import { asyncErrorHandler } from "./utils/asyncErrorHandler.utils.ts";
import { initializeTomTom } from "./config/tomTomMapConfig.ts";
import placesRouter from "./routes/places.routes.ts";
import cors from "cors"

initializeTomTom();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(cors())

app.get("/hello", asyncErrorHandler(async (req, res, next) => {
    res.send("hello world");
}));

app.use("/api/places", placesRouter);


app.use(errorHandlerMiddeware);
export default app;
