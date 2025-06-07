import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

/**
 * Augment Express Request type to include `user` after token verification
 */
declare module "express-serve-static-core" {
  interface Request {
    user?: { username: string };
  }
}

/**
 * Middleware to verify JWT in Authorization header for protected routes.
 * Expects header "Authorization: Bearer <token>"
 * On success, attaches decoded payload to req.user and calls next().
 * On missing token, sends 401. On invalid token, sends 403.
 */
export function verifyAuthToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.get("Authorization");
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).end();
    return ;
  }

  const secret = req.app.locals.JWT_SECRET as string;
  jwt.verify(token, secret, (err, decoded) => {
    if (err || !decoded) {
      res.status(403).end();
      return ;
    }
    req.user = decoded as { username: string };
    next();
  });
}
