const dotenv = require("dotenv");
dotenv.config();

const { createServer } = require("http");

const connectDB = require("./config/db");
const app = require("./app");

const { initSocket } = require("./config/socket");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    const httpServer = createServer(app);

    initSocket(httpServer);

    httpServer.listen(PORT, () => {
      console.log(
        `RoadWatch server running on port ${PORT}`
      );

      console.log(
        `Socket.IO running on port ${PORT}`
      );
    });
  } catch (error) {
    console.error(
      "Server startup failed:",
      error.message
    );

    process.exit(1);
  }
};

startServer();