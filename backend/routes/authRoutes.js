
// const express = require("express");
// const router = express.Router();
// const { body, validationResult } = require("express-validator");
// const rateLimit = require("express-rate-limit");
// const {
//   register,
//   login,
//   logout,
//   verifyToken,
//   checkRoles,
//   refreshAccessToken,
// } = require("../controllers/authController");

// // Rate limiter: Limit each IP to 10 requests per 15 minutes for auth endpoints.
// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 10, // 10 requests per window per IP
//   message: "Too many attempts, please try again after 15 minutes.",
// });

// // Registration route
// router.post(
//   "/register",
//   authLimiter,
//   [
//     body("name").notEmpty().withMessage("Name is required."),
//     body("email").isEmail().withMessage("A valid email is required."),
//     body("password")
//       .isLength({ min: 6 })
//       .withMessage("Password must be at least 6 characters long."),
//     body("role")
//       .optional()
//       .isIn(["user", "admin", "moderator"])
//       .withMessage("Invalid role."),
//   ],
//   async (req, res) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty())
//       return res.status(400).json({ errors: errors.array() });
//     try {
//       const { name, email, password, role } = req.body;
//       const result = await register({ name, email, password, role });
//       res.status(201).json(result);
//     } catch (err) {
//       res.status(400).json({ message: err.message });
//     }
//   }
// );

// // Login route
// router.post(
//   "/login",
//   authLimiter,
//   [
//     body("email").isEmail().withMessage("A valid email is required."),
//     body("password").notEmpty().withMessage("Password is required."),
//   ],
//   async (req, res) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty())
//       return res.status(400).json({ errors: errors.array() });
//     try {
//       const { email, password } = req.body;
//       const result = await login({ email, password });
//       res.status(200).json(result);
//     } catch (err) {
//       res.status(400).json({ message: err.message });
//     }
//   }
// );

// // Logout route
// router.post("/logout", verifyToken, async (req, res) => {
//   try {
//     await logout(req.user._id);
//     res.status(200).json({ message: "Logged out successfully" });
//   } catch (err) {
//     res.status(500).json({ message: "Logout failed" });
//   }
// });

// // Refresh token route
// router.post("/refresh", async (req, res) => {
//   try {
//     const { refreshToken } = req.body;
//     if (!refreshToken) {
//       return res.status(400).json({ error: "Refresh token is required" });
//     }
//     const newAccessToken = await refreshAccessToken(refreshToken);
//     res.status(200).json({ accessToken: newAccessToken });
//   } catch (err) {
//     res.status(401).json({ error: err.message });
//   }
// });

// // Protected admin-only route example using our generic role-checking middleware
// router.get("/admin", verifyToken, checkRoles(["admin"]), (req, res) => {
//   res.status(200).json({ message: "Welcome, Admin!" });
// });

// // Protected route accessible by admin or moderator
// router.get(
//   "/adminOrModerator",
//   verifyToken,
//   checkRoles(["admin", "moderator"]),
//   (req, res) => {
//     res.status(200).json({ message: "Welcome, Admin or Moderator!" });
//   }
// );

// module.exports = router;


const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const rateLimit = require("express-rate-limit");
const {
  register,
  login,
  logout,
  verifyToken,
  checkRoles,
  refreshAccessToken,
} = require("../controllers/authController");

// Rate limiter configuration for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Maximum 10 requests per IP
  message: "Too many attempts, please try again after 15 minutes.",
});

// Registration endpoint
router.post(
  "/register",
  authLimiter,
  [
    body("name").notEmpty().withMessage("Name is required."),
    body("email").isEmail().withMessage("A valid email is required."),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long."),
    body("role")
      .optional()
      .isIn(["user", "admin", "moderator"])
      .withMessage("Invalid role."),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });
    try {
      const { name, email, password, role } = req.body;
      const result = await register({ name, email, password, role });
      res.status(201).json(result);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
);

// Login endpoint
router.post(
  "/login",
  authLimiter,
  [
    body("email").isEmail().withMessage("A valid email is required."),
    body("password").notEmpty().withMessage("Password is required."),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });
    try {
      const { email, password } = req.body;
      const result = await login({ email, password });
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
);

// Logout endpoint
router.post("/logout", verifyToken, async (req, res) => {
  try {
    await logout(req.user._id);
    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ message: "Logout failed" });
  }
});

// Refresh token endpoint
router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token is required" });
    }
    const newAccessToken = await refreshAccessToken(refreshToken);
    res.status(200).json({ accessToken: newAccessToken });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

// Protected admin-only route example using role-checking middleware
router.get("/admin", verifyToken, checkRoles(["admin"]), (req, res) => {
  res.status(200).json({ message: "Welcome, Admin!" });
});

// Protected route accessible by admin or moderator
router.get(
  "/adminOrModerator",
  verifyToken,
  checkRoles(["admin", "moderator"]),
  (req, res) => {
    res.status(200).json({ message: "Welcome, Admin or Moderator!" });
  }
);

module.exports = router;
