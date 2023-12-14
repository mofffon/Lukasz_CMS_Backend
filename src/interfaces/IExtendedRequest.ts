import { Request } from "express";
import { JwtPayload } from "jsonwebtoken";

export default interface IExtendedRequest extends Request {
  user?: JwtPayload;
  admin?: JwtPayload;
}
