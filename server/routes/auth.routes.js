
const express = require("express");
const protect = require("../middleware/auth");

const {
  registerUser,
  loginUser,
  getCurrentUser,
  updateCurrentUser,
} = require("../controllers/auth.controller");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

// Authenticated user's profile
router.get("/me", protect, getCurrentUser);
router.patch("/me", protect, updateCurrentUser);

module.exports = router;

