import { useRef } from "react";
import { io, Socket } from "socket.io-client";

export const useSocket = (path: string) => {
  const socketRef = useRef<Socket>(
    io(path, {
      reconnection: false,
    })
  );
  return socketRef.current;
};
