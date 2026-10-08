const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

let io;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin:
        process.env.CLIENT_URL ||
        "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: false,
    },
  });

  // ----------------------------------------
  // Socket authentication
  // ----------------------------------------

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(
          new Error("Authentication token is required.")
        );
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );

      if (!decoded?.userId) {
        return next(
          new Error("Invalid authentication token.")
        );
      }

      const user = await User.findById(
        decoded.userId
      ).select(
        "_id name email role isActive"
      );

      if (!user) {
        return next(
          new Error("User not found.")
        );
      }

      if (!user.isActive) {
        return next(
          new Error("User account is inactive.")
        );
      }

      // Attach authenticated user to socket
      socket.user = user;

      next();
    } catch (error) {
      console.error(
        "Socket authentication error:",
        error.message
      );

      return next(
        new Error("Not authorized.")
      );
    }
  });

  // ----------------------------------------
  // Connection
  // ----------------------------------------

  io.on("connection", (socket) => {
    const userId = socket.user._id.toString();
    const role = socket.user.role;

    // Private room for this user
    socket.join(`user:${userId}`);

    // Role room for future admin/officer events
    socket.join(`role:${role}`);

    console.log(
      `Socket connected: ${socket.user.email} (${socket.id})`
    );

    socket.on("disconnect", (reason) => {
      console.log(
        `Socket disconnected: ${socket.user.email} (${reason})`
      );
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error(
      "Socket.IO has not been initialized."
    );
  }

  return io;
};

module.exports = {
  initSocket,
  getIO,
};
