import React, { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";
import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  const { data: authUser } = useQuery({
    queryKey: ["authUser"],
    queryFn: async () => {
      const res = await axiosInstance.get("/auth/me");
      return res.data;
    },
  });

  useEffect(() => {
    if (authUser && authUser._id) {
      console.log(
        "CONTEXT: Creating socket for user:",
        authUser.firstName,
        "ID:",
        authUser._id
      );
      console.log("CONTEXT: Server URL:", import.meta.env.VITE_SERVER_URL);

      const newSocket = io(import.meta.env.VITE_SOCKET_URL, {
        transports: ["websocket", "polling"],
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      setSocket(newSocket);

      newSocket.on("connect", () => {
        console.log("CONTEXT: Socket connected, ID:", newSocket.id);
        newSocket.emit("joinUser", authUser._id);
        console.log("CONTEXT: Emitted joinUser for:", authUser._id);
      });

      newSocket.on("connect_error", (error) => {
        console.error("CONTEXT: Socket connection error:", error);
      });

      newSocket.on("userOnline", (userId) => {
        console.log("CONTEXT: User came online:", userId);
        setOnlineUsers((prev) => {
          const newSet = new Set(prev);
          newSet.add(userId);
          return newSet;
        });
      });

      newSocket.on("userOffline", (userId) => {
        console.log("CONTEXT: User went offline:", userId);
        setOnlineUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      });

      return () => {
        console.log("CONTEXT: Closing socket");
        newSocket.close();
      };
    } else {
      console.log("CONTEXT: No auth user, not creating socket");
    }
  }, [authUser?._id]); 
  const joinUser = (userId) => {
    if (socket) {
      socket.emit("joinUser", userId);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, joinUser }}>
      {children}
    </SocketContext.Provider>
  );
};