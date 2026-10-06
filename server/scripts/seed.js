const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");

const connectDB = require("../config/db");

const User = require("../models/User");
const Department = require("../models/Department");
const ServiceArea = require("../models/ServiceArea");

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();

    // 1. Create/find Road Maintenance department
    let department = await Department.findOne({
      name: "Road Maintenance",
    });

    if (!department) {
      department = await Department.create({
        name: "Road Maintenance",
        categories: [
          "pothole",
          "broken_road",
          "road_debris",
          "road_sign",
        ],
        description:
          "Responsible for road conditions, potholes, road debris, and road signs.",
        isActive: true,
      });

      console.log("Road Maintenance department created");
    } else {
      console.log("Road Maintenance department already exists");
    }

    // 2. Create/find Knowledge Park service area
    let serviceArea = await ServiceArea.findOne({
      name: "Knowledge Park",
      city: "Greater Noida",
    });

    if (!serviceArea) {
      serviceArea = await ServiceArea.create({
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

      console.log("Knowledge Park service area created");
    } else {
      console.log("Knowledge Park service area already exists");
    }

    // 3. Create/find test officer
    const officerEmail = "officer@roadwatch.test";

    let officer = await User.findOne({
      email: officerEmail,
    });

    const hashedPassword = await bcrypt.hash(
      "Officer@123",
      12
    );

    if (!officer) {
      officer = await User.create({
        name: "RoadWatch Officer",
        email: officerEmail,
        password: hashedPassword,
        role: "officer",
        department: department._id,
        assignedAreas: [serviceArea._id],
        isActive: true,
      });

      console.log("Test officer created");
    } else {
      officer.department = department._id;
      officer.assignedAreas = [serviceArea._id];
      officer.role = "officer";
      officer.isActive = true;

      await officer.save();

      console.log("Test officer already exists — assignment updated");
    }

    console.log("\nSeed completed successfully:");
    console.log("--------------------------------");
    console.log("Department:", department.name);
    console.log("Service Area:", serviceArea.name);
    console.log("Officer:", officer.name);
    console.log("Officer Email:", officer.email);
    console.log("--------------------------------");

    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
};

seedData();
