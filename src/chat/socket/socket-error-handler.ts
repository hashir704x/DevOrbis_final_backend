import { Socket } from "socket.io";

export function socketErrorHandler(socket: Socket, error: unknown) {
  const message =
    error instanceof Error ? error.message : "An unexpected error occurred";
  socket.emit("chat:error", {
    message,
  });
}
