import { Request, Response, Express } from "express";
import { Session } from "express-session";

export type MyContext = {
  // req: Request & { session: Express.Session };
  req: Request & { session?: Session & { userId?: number } };
  res: Response;
};
