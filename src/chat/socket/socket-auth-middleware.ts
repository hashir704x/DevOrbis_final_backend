import type { Socket } from "socket.io";
import { verifyToken } from "../../utils/jwt.js";

function getAccessToken(cookieHeader: string | undefined) {
  if (!cookieHeader) {
    return null;
  }
  const token = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith("agentic_rag_access_token="))
    ?.split("=")[1];
  return token ?? null;
}

export function socketAuthMiddleware(socket: Socket, next: (err?: Error) => void) {
  const token = getAccessToken(socket.handshake.headers.cookie);
  if (!token) {
    return next(new Error("Not authenticated"));
  }
  const userData = verifyToken(token);
  if (!userData) {
    return next(new Error("Not authenticated"));
  }
  socket.data.userData = userData;
  next();
}
