import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/apiResponse.utils.ts";
import logger from "../config/logger.ts";



export const errorHandlerMiddeware = async (err: Error, req: Request, res: Response, next: NextFunction) => {
    let apiError: ApiError;

    if (err instanceof ApiError) {
        apiError = err;
    } else {
        if (err instanceof Error) {
            apiError = ApiError.internal(err.message);
        } else {
            apiError = ApiError.internal("INTERNAL_SERVER_ERROR");
        }
    }

    logger.error(apiError);
    return res.status(apiError.error.statusCode).json({
        success: false,
        error: apiError.error,
    });
};