import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  auth: {
    username: localStorage.getItem("username") || "",
  },
});

// Update auth when connecting
export function updateSocketAuth() {
  socket.auth = {
    username: localStorage.getItem("username") || "",
  };
}