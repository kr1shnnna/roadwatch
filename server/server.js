const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth.routes");
const reportRoutes = require("./routes/report.routes");
const assignmentRoutes = require("./routes/assignment.routes");
const notificationRoutes = require("./routes/notification.routes");
const app = express();

// Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/notifications", notificationRoutes);


// Test route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "RoadWatch API is running 🚧",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`RoadWatch server running on port ${PORT}`);
});