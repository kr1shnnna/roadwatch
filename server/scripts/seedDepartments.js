const dotenv = require("dotenv");

const connectDB = require("../config/db");
const Department = require("../models/Department");

dotenv.config();

const departments = [
  {
    name: "Road Maintenance",
    categories: [
      "pothole",
      "broken_road",
      "road_debris",
      "road_sign",
    ],
    description:
      "Responsible for potholes, damaged roads, road debris, and road signs.",
  },
  {
    name: "Electrical Maintenance",
    categories: [
      "streetlight",
    ],
    description:
      "Responsible for streetlight installation, maintenance, and repairs.",
  },
  {
    name: "Traffic Management",
    categories: [
      "traffic_signal",
    ],
    description:
      "Responsible for traffic signals and related traffic control infrastructure.",
  },
  {
    name: "Water and Drainage",
    categories: [
      "waterlogging",
      "drainage",
    ],
    description:
      "Responsible for waterlogging, drainage systems, and related water infrastructure.",
  },
  {
    name: "Public Infrastructure",
    categories: [
      "open_manhole",
    ],
    description:
      "Responsible for open manholes and other public infrastructure safety issues.",
  },
  {
    name: "General Civic Services",
    categories: [
      "other",
    ],
    description:
      "Handles civic issues that do not fall under a specific department.",
  },
];

const seedDepartments = async () => {
  try {
    await connectDB();

    for (const departmentData of departments) {
      const existingDepartment = await Department.findOne({
        name: departmentData.name,
      });

      if (existingDepartment) {
        existingDepartment.categories = departmentData.categories;
        existingDepartment.description = departmentData.description;
        existingDepartment.isActive = true;

        await existingDepartment.save();

        console.log(
          `Updated department: ${departmentData.name}`
        );
      } else {
        await Department.create({
          ...departmentData,
          isActive: true,
        });

        console.log(
          `Created department: ${departmentData.name}`
        );
      }
    }

    console.log("\nDepartment seeding completed successfully.");
    console.log("----------------------------------------");

    const allDepartments = await Department.find()
      .select("name categories isActive")
      .sort({ name: 1 });

    allDepartments.forEach((department) => {
      console.log(
        `${department.name} → ${department.categories.join(", ")}`
      );
    });

    console.log("----------------------------------------");

    process.exit(0);
  } catch (error) {
    console.error("Department seed error:", error);
    process.exit(1);
  }
};

seedDepartments();
