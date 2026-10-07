require("dotenv").config();

process.env.JWT_SECRET = "test-secret";

const mongoose = require("mongoose");

beforeAll(async () => {
  const mongoUri = process.env.MONGO_TEST_URI;

  if (!mongoUri) {
    throw new Error("MONGO_TEST_URI is not defined in .env");
  }

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 30000,
  });

  console.log("Connected to test database:", mongoose.connection.name);
}, 45000);

afterEach(async () => {
  if (mongoose.connection.readyState !== 1) {
    return;
  }

  const collections = mongoose.connection.collections;

  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
});