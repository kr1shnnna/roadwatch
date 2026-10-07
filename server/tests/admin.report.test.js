const request = require("supertest");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const app = require("../app");

const User = require("../models/User");
const Report = require("../models/Report");
const Department = require("../models/Department");
const ServiceArea = require("../models/ServiceArea");
const Assignment = require("../models/Assignment");

const createToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET || "test-secret",
    {
      expiresIn: "1h",
    }
  );
};

const createUser = async ({
  name,
  email,
  role,
  department = null,
  assignedAreas = [],
}) => {
  const password = await bcrypt.hash(
    "Password@123",
    8
  );

  return User.create({
    name,
    email,
    password,
    role,
    department,
    assignedAreas,
  });
};

const createTestDepartment = async () => {
  return Department.create({
    name: "Road Maintenance",
    categories: [
      "pothole",
      "broken_road",
      "road_debris",
    ],
    description:
      "Handles road-related issues.",
  });
};

const createTestServiceArea = async () => {
  return ServiceArea.create({
    name: "Knowledge Park",
    city: "Greater Noida",
    boundary: {
      type: "Polygon",
      coordinates: [
        [
          [77.375, 28.445],
          [77.405, 28.445],
          [77.405, 28.475],
          [77.375, 28.475],
          [77.375, 28.445],
        ],
      ],
    },
    isActive: true,
  });
};

const createTestReport = async ({
  citizenId,
  status = "reported",
  assignedTo = null,
  category = "pothole",
  priority = "medium",
}) => {
  return Report.create({
    title: "Test pothole report",
    description:
      "A test pothole report for automated testing.",
    location: {
      type: "Point",
      coordinates: [77.395, 28.46],
    },
    category,
    priority,
    status,
    reportedBy: citizenId,
    assignedTo,
  });
};

describe("Admin Report Management API", () => {
  let admin;
  let citizen;
  let officer;
  let secondOfficer;

  let department;
  let serviceArea;

  let adminToken;
  let citizenToken;

  beforeEach(async () => {
    department =
      await createTestDepartment();

    serviceArea =
      await createTestServiceArea();

    admin = await createUser({
      name: "Test Admin",
      email: "admin@test.com",
      role: "authority_admin",
    });

    citizen = await createUser({
      name: "Test Citizen",
      email: "citizen@test.com",
      role: "citizen",
    });

    officer = await createUser({
      name: "Test Officer",
      email: "officer@test.com",
      role: "officer",
      department: department._id,
      assignedAreas: [
        serviceArea._id,
      ],
    });

    secondOfficer = await createUser({
      name: "Second Officer",
      email: "officer2@test.com",
      role: "officer",
      department: department._id,
      assignedAreas: [
        serviceArea._id,
      ],
    });

    adminToken = createToken(admin);
    citizenToken = createToken(citizen);
  });

  // --------------------------------------------------
  // Authorization
  // --------------------------------------------------

  test("rejects unauthenticated access", async () => {
    const response = await request(app)
      .get("/api/admin/reports");

    expect(response.status).toBe(401);

    expect(response.body.success).toBe(false);
  });

  test("rejects citizen access", async () => {
    const response = await request(app)
      .get("/api/admin/reports")
      .set(
        "Authorization",
        `Bearer ${citizenToken}`
      );

    expect(response.status).toBe(403);

    expect(response.body.success).toBe(false);
  });

  test("allows authority admin access", async () => {
    const response = await request(app)
      .get("/api/admin/reports")
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      );

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);
  });

  // --------------------------------------------------
  // Filtering
  // --------------------------------------------------

  test("filters reports by status and category", async () => {
    await createTestReport({
      citizenId: citizen._id,
      status: "reported",
      category: "pothole",
    });

    await createTestReport({
      citizenId: citizen._id,
      status: "resolved",
      category: "pothole",
    });

    await createTestReport({
      citizenId: citizen._id,
      status: "reported",
      category: "broken_road",
    });

    const response = await request(app)
      .get(
        "/api/admin/reports?status=reported&category=pothole"
      )
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      );

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);

    expect(
      response.body.pagination.total
    ).toBe(1);

    expect(
      response.body.reports[0].status
    ).toBe("reported");

    expect(
      response.body.reports[0].category
    ).toBe("pothole");
  });

  test("filters unassigned reports", async () => {
    await createTestReport({
      citizenId: citizen._id,
      status: "reported",
      assignedTo: null,
    });

    await createTestReport({
      citizenId: citizen._id,
      status: "reported",
      assignedTo: officer._id,
    });

    const response = await request(app)
      .get(
        "/api/admin/reports?assigned=false"
      )
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      );

    expect(response.status).toBe(200);

    expect(
      response.body.pagination.total
    ).toBe(1);

    expect(
      response.body.reports[0].assignedTo
    ).toBeNull();
  });

  // --------------------------------------------------
  // Unassigned endpoint
  // --------------------------------------------------

  test("returns unassigned reports", async () => {
    await createTestReport({
      citizenId: citizen._id,
      status: "reported",
      assignedTo: null,
    });

    const response = await request(app)
      .get(
        "/api/admin/reports/unassigned"
      )
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      );

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.count).toBe(1);
  });

  // --------------------------------------------------
  // Manual assignment
  // --------------------------------------------------

  test("admin can manually assign an unassigned report", async () => {
    const report =
      await createTestReport({
        citizenId: citizen._id,
        status: "reported",
        assignedTo: null,
      });

    const response = await request(app)
      .patch(
        `/api/admin/reports/${report._id}/assign`
      )
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      )
      .send({
        officerId: officer._id.toString(),
      });

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);

    expect(
      response.body.report.assignedTo.toString()
    ).toBe(
      officer._id.toString()
    );

    expect(
      response.body.report.status
    ).toBe("assigned");

    const assignment =
      await Assignment.findOne({
        report: report._id,
        officer: officer._id,
      });

    expect(assignment).not.toBeNull();

    expect(
      assignment.assignedBy.toString()
    ).toBe(
      admin._id.toString()
    );

    expect(
      assignment.status
    ).toBe("assigned");
  });

  test("admin cannot assign an already assigned report", async () => {
    const report =
      await createTestReport({
        citizenId: citizen._id,
        status: "assigned",
        assignedTo: officer._id,
      });

    const response = await request(app)
      .patch(
        `/api/admin/reports/${report._id}/assign`
      )
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      )
      .send({
        officerId: secondOfficer._id.toString(),
      });

    expect(response.status).toBe(400);

    expect(
      response.body.message
    ).toContain("already assigned");
  });

  // --------------------------------------------------
  // Reassignment
  // --------------------------------------------------

  test("admin can reassign a report to another officer", async () => {
    const report =
      await createTestReport({
        citizenId: citizen._id,
        status: "assigned",
        assignedTo: officer._id,
      });

    const oldAssignment =
      await Assignment.create({
        report: report._id,
        serviceArea: serviceArea._id,
        department: department._id,
        officer: officer._id,
        assignedBy: admin._id,
        status: "assigned",
      });

    const response = await request(app)
      .patch(
        `/api/admin/reports/${report._id}/reassign`
      )
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      )
      .send({
        officerId:
          secondOfficer._id.toString(),

        reason:
          "Previous officer is unavailable.",
      });

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);

    expect(
      response.body.report.assignedTo.toString()
    ).toBe(
      secondOfficer._id.toString()
    );

    const updatedOldAssignment =
      await Assignment.findById(
        oldAssignment._id
      );

    expect(
      updatedOldAssignment.status
    ).toBe("rejected");

    expect(
      updatedOldAssignment.rejectionReason
    ).toContain(
      "Previous officer is unavailable."
    );

    const newAssignment =
      await Assignment.findOne({
        report: report._id,
        officer: secondOfficer._id,
      });

    expect(newAssignment).not.toBeNull();

    expect(
      newAssignment.status
    ).toBe("assigned");

    expect(
      newAssignment.assignedBy.toString()
    ).toBe(
      admin._id.toString()
    );
  });

  test("reassignment requires a reason", async () => {
    const report =
      await createTestReport({
        citizenId: citizen._id,
        status: "assigned",
        assignedTo: officer._id,
      });

    await Assignment.create({
      report: report._id,
      serviceArea: serviceArea._id,
      department: department._id,
      officer: officer._id,
      assignedBy: admin._id,
      status: "assigned",
    });

    const response = await request(app)
      .patch(
        `/api/admin/reports/${report._id}/reassign`
      )
      .set(
        "Authorization",
        `Bearer ${adminToken}`
      )
      .send({
        officerId:
          secondOfficer._id.toString(),
      });

    expect(response.status).toBe(400);

    expect(
      response.body.message
    ).toContain("reason is required");
  });
});