const { Server } = require("socket.io");
const User = require("../models/user");

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Store online users
  const onlineUsers = new Map();

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Join user to their personal room
    socket.on("joinUser", async (userId) => {
      socket.userId = userId;
      onlineUsers.set(userId, socket.id);
      socket.join(userId);
      console.log(`User ${userId} joined with socket ${socket.id}`);

      try {
        // Update user status to online in database
        await User.findByIdAndUpdate(userId, { 
          isOnline: true, 
          lastSeen: new Date() 
        });

        // Notify all other users that this user is online
        socket.broadcast.emit('userOnline', userId);
        console.log(`User ${userId} is now online`);
      } catch (error) {
        console.error('Error updating user online status:', error);
      }
    });

    // Handle typing indicators
    socket.on("typing", (data) => {
      socket.to(data.recipientId).emit("userTyping", {
        senderId: data.senderId,
        isTyping: data.isTyping,
      });
    });

    // Handle disconnect
    socket.on("disconnect", async () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        console.log(`User ${socket.userId} disconnected`);

        try {
          // Update user status to offline in database
          await User.findByIdAndUpdate(socket.userId, { 
            isOnline: false, 
            lastSeen: new Date() 
          });

          // Notify all other users that this user is offline
          socket.broadcast.emit('userOffline', socket.userId);
          console.log(`User ${socket.userId} is now offline`);
        } catch (error) {
          console.error('Error updating user offline status:', error);
        }
      }
    });

    // Handle new messages
    socket.on("sendMessage", (data) => {
      // Emit to recipient
      socket.to(data.recipientId).emit("newMessage", data);
    });

    // Handle message deletion
    socket.on("deleteMessage", (data) => {
      // Emit to recipient
      socket.to(data.recipientId).emit("messageDeleted", data.messageId);
    });

    // Handle message editing
    socket.on("editMessage", (data) => {
      // Emit to recipient
      socket.to(data.recipientId).emit("messageEdited", data.message);
    });
  });

  return io;
};

const emitSocketEvent = (userId, event, data) => {
  if (io) {
    io.to(userId).emit(event, data);
  }
};

const getOnlineUsers = () => {
  return Array.from(onlineUsers.keys());
};

module.exports = {
  initializeSocket,
  emitSocketEvent,
  getOnlineUsers,
};