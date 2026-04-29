import type { Request, Response, NextFunction } from "express";

export const asyncErrorHandler =
    (
        fn: (req: Request, res: Response, next?: NextFunction) => Promise<unknown>
    ) =>
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                await fn(req, res, next);
            } catch (error) {
                next(error);
            }
        };