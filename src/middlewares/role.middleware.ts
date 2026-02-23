import type { Request, Response, NextFunction } from "express";

const roleMiddleware = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // authMiddleware MUST run before this
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { userRole } = req.user;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  };
};

export default roleMiddleware;
