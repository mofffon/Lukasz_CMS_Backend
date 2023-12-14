import jwt from "jsonwebtoken";
import { Response, NextFunction } from "express";
import IExtendedRequest from "../interfaces/IExtendedRequest";

export default (
  req: IExtendedRequest,
  res: Response,
  next: NextFunction
): void => {
  const token = req.header("x-auth-token");
  if (!token) {
    res.status(401).send("401: Access denied. No token provided.");
    return;
  }

  if (process.env.JWT_PRIVATE_KEY_ADMIN)
    try {
      const decoded = jwt.verify(token, process.env.JWT_PRIVATE_KEY_ADMIN);
      req.admin = decoded as jwt.JwtPayload;
      next();
      return;
    } catch (error) {
      console.log(error);
      res.status(400).send("400: Invalid token.");
      return;
    }

  res.send(500).send("Something is wrong. We are working on it.");
  return;
};
