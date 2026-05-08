import express from "express";
import morgan from "morgan";
import { errorHandlerMiddeware } from "./middlewares/errorHandler.middleware.ts";
import { asyncErrorHandler } from "./utils/asyncErrorHandler.utils.ts";
import { initializeTomTom } from "./config/tomTomMapConfig.ts";
import placesRouter from "./routes/places.routes.ts";
import cors from "cors"
import compression from "compression"
import { envConfig } from "./envConfig.ts";

initializeTomTom();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(cors({
    origin : envConfig.CORS_ORIGIN.split(",")
}))
app.use(compression())

app.get("/", asyncErrorHandler(async (req, res, next) => {
    if(envConfig.CLIENT_URL){
        res.redirect(envConfig.CLIENT_URL);
    }else{
        res.send("hello world");
    }
}));

app.use("/api/places", placesRouter);


app.use(errorHandlerMiddeware);
export default app;
