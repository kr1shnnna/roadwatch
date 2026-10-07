const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const reportRoutes = require("./routes/report.routes");
const assignmentRoutes = require("./routes/assignment.routes");
const notificationRoutes = require("./routes/notification.routes");
const adminRoutes = require("./routes/admin.routes");
const adminReportRoutes = require("./routes/admin.report.routes");
const adminOfficerRoutes = require("./routes/admin.officer.routes");
const adminDepartmentRoutes = require("./routes/admin.department.routes");
const adminServiceAreaRoutes = require("./routes/admin.serviceArea.routes");
const adminAuditRoutes = require("./routes/admin.audit.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/reports", adminReportRoutes);
app.use("/api/admin/officers", adminOfficerRoutes);
app.use("/api/admin/departments", adminDepartmentRoutes);
app.use("/api/admin/service-areas", adminServiceAreaRoutes);
app.use("/api/admin/audit-logs", adminAuditRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "RoadWatch API is running 🚧",
  });
});

module.exports = app;
