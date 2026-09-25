import type { roles } from "./types.ts";
declare global {
  namespace Express {
    interface Request {
      userData?: {
        userId: string;
        role: roles;
      };
    }
  }
}

export {};
