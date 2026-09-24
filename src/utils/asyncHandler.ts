import type { Request, Response, NextFunction } from "express";

export function asyncHandler(
    handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
    return function (req: Request, res: Response, next: NextFunction) {
        Promise.resolve(handler(req, res, next)).catch(next);
    };
}
