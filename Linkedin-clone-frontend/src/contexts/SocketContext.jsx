import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '../lib/axios';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const { data: authUser } = useQuery({ queryKey: ["authUser"] });

  useEffect(() => {
    if (authUser) {
      const newSocket = io(import.meta.env.VITE_SERVER_URL);
      setSocket(newSocket);

      newSocket.emit('joinUser', authUser._id);

      newSocket.on('userOnline', (userId) => {
        setOnlineUsers(prev => new Set(prev).add(userId));
      });

      newSocket.on('userOffline', (userId) => {
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      });

      return () => {
        newSocket.close();
      };
    }
  }, [authUser]);

  const joinUser = (userId) => {
    if (socket) {
      socket.emit('joinUser', userId);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, joinUser }}>
      {children}
    </SocketContext.Provider>
  );
};