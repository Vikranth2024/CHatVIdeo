// const jwt = require("jsonwebtoken");
// const bcrypt = require("bcrypt");
// const User = require("../models/User");

// /**
//  * Generates an access token for a given user.
//  * The access token expires in 1 hour.
//  */
// function generateAccessToken(user) {
//   const payload = { id: user._id, email: user.email, role: user.role };
//   return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
// }

// /**
//  * Generates a refresh token for a given user.
//  * The refresh token expires in 7 days.
//  */
// function generateRefreshToken(user) {
//   const payload = { id: user._id, email: user.email };
//   return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
// }

// /**
//  * Legacy generateToken function (optional, not used for refresh flow)
//  */
// function generateToken(user) {
//   const payload = { id: user._id, email: user.email };
//   return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
// }

// /**
//  * Registers a new user.
//  * - Checks if the user already exists.
//  * - Hashes the password using bcrypt (12 salt rounds).
//  * - Saves the new user with the given role (default "user").
//  * - Generates and saves both access and refresh tokens.
//  * - Returns the tokens and user details.
//  */
// async function register({ name, email, password, role = "user" }) {
//   const existingUser = await User.findOne({ email });
//   if (existingUser) {
//     throw new Error("User already exists.");
//   }

//   const hashedPassword = await bcrypt.hash(password, 12);
//   const user = new User({ name, email, password: hashedPassword, role });
//   await user.save();

//   const accessToken = generateAccessToken(user);
//   const refreshToken = generateRefreshToken(user);

//   user.activeToken = accessToken;
//   user.refreshToken = refreshToken;
//   await user.save();

//   return { accessToken, refreshToken, user };
// }

// /**
//  * Logs in an existing user.
//  * - Finds a user by email.
//  * - Uses bcrypt to compare passwords.
//  * - Generates new access and refresh tokens and updates the user record.
//  * - Returns the tokens and user details.
//  */
// async function login({ email, password }) {
//   const user = await User.findOne({ email });
//   if (!user) throw new Error("Invalid credentials.");

//   const isMatch = await bcrypt.compare(password, user.password);
//   if (!isMatch) throw new Error("Invalid credentials.");

//   const accessToken = generateAccessToken(user);
//   const refreshToken = generateRefreshToken(user);

//   user.activeToken = accessToken;
//   user.refreshToken = refreshToken;
//   await user.save();

//   return { accessToken, refreshToken, user };
// }

// /**
//  * Logs out a user.
//  * - Clears both the activeToken and refreshToken fields in the database.
//  */
// async function logout(userId) {
//   try {
//     console.log("Logout initiated for user ID:", userId);
//     const user = await User.findById(userId);
//     if (!user) {
//       console.log("User not found during logout.");
//       throw new Error("User not found.");
//     }
//     user.activeToken = null;
//     user.refreshToken = null;
//     await user.save();
//     console.log("Logout successful for user:", user.email);
//   } catch (err) {
//     console.error("Error during logout:", err.message);
//     throw new Error("Logout failed.");
//   }
// }

// /**
//  * Middleware to verify the access token.
//  * - Extracts the token from the Authorization header.
//  * - Verifies the token and fetches the user from the database.
//  * - Ensures the token matches the active token stored for the user.
//  * - Attaches the full user object (including role) to req.user.
//  */
// async function verifyToken(req, res, next) {
//   const token = req.headers.authorization?.split(" ")[1]; // Extract Bearer token
//   if (!token) return res.status(401).json({ error: "Unauthorized" });

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     console.log("Decoded token payload:", decoded);
//     const user = await User.findById(decoded.id);
//     if (!user || user.activeToken !== token) {
//       console.log("Token mismatch or user not found.");
//       return res.status(401).json({ error: "Invalid or expired token" });
//     }
//     req.user = user; // Attach the full user object
//     console.log("Authenticated user attached to req.user:", req.user);
//     next();
//   } catch (err) {
//     console.error("Error in token verification:", err.message);
//     return res.status(401).json({ error: "Invalid or expired token" });
//   }
// }

// /**
//  * Generic middleware to check if the authenticated user has one of the allowed roles.
//  * @param {Array} allowedRoles - Array of roles that are permitted access.
//  */
// function checkRoles(allowedRoles = []) {
//   return (req, res, next) => {
//     console.log("User role:", req.user.role);
//     console.log("Allowed roles:", allowedRoles);
//     if (!allowedRoles.includes(req.user.role)) {
//       console.log("Access denied: User role does not match allowed roles.");
//       return res.status(403).json({ error: "Forbidden: You do not have access to this resource." });
//     }
//     next();
//   };
// }

// /**
//  * Refreshes the access token using a valid refresh token.
//  * - Verifies the refresh token using JWT_REFRESH_SECRET.
//  * - Checks that the provided refresh token matches the one stored in the database.
//  * - Generates a new access token, updates the user record, and returns the new token.
//  */
// async function refreshAccessToken(refreshToken) {
//   try {
//     const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
//     const user = await User.findById(decoded.id);
//     if (!user || user.refreshToken !== refreshToken) {
//       throw new Error("Invalid refresh token");
//     }
//     const newAccessToken = generateAccessToken(user);
//     user.activeToken = newAccessToken;
//     await user.save();
//     return newAccessToken;
//   } catch (err) {
//     throw new Error("Invalid or expired refresh token");
//   }
// }

// module.exports = {
//   generateToken,
//   generateAccessToken,
//   generateRefreshToken,
//   register,
//   login,
//   logout,
//   verifyToken,
//   checkRoles,
//   refreshAccessToken,
// };


const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const Log = require("../models/Log");

/**
 * Helper function: Logs the given action for a user.
 * @param {String} action - The action performed.
 * @param {String} email - The user's email.
 * @param {String} status - The result of the action ("success" or "failed").
 */
async function logAction(action, email, status) {
  try {
    await Log.create({ action, email, status, timestamp: new Date() });
  } catch (err) {
    console.error("Failed to log action:", err.message);
  }
}

/**
 * Generates an access token for a given user.
 * The access token expires in 1 hour.
 */
function generateAccessToken(user) {
  const payload = { id: user._id, email: user.email, role: user.role };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
}

/**
 * Generates a refresh token for a given user.
 * The refresh token expires in 7 days.
 */
function generateRefreshToken(user) {
  const payload = { id: user._id, email: user.email };
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
}

/**
 * (Legacy) Generates a token for a given user.
 * Token expires in 1 hour.
 */
function generateToken(user) {
  const payload = { id: user._id, email: user.email };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
}

/**
 * Registers a new user.
 * - Checks if the user already exists.
 * - Hashes the password using bcrypt (12 salt rounds).
 * - Saves the new user with the given role (default "user").
 * - Generates and saves both access and refresh tokens.
 * - Logs the action and returns tokens and user details.
 */
async function register({ name, email, password, role = "user" }) {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    await logAction("registration", email, "failed");
    throw new Error("User already exists.");
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = new User({ name, email, password: hashedPassword, role });
  await user.save();

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  user.activeToken = accessToken;
  user.refreshToken = refreshToken;
  await user.save();

  await logAction("registration", email, "success");
  return { accessToken, refreshToken, user };
}

/**
 * Logs in an existing user.
 * - Finds the user by email.
 * - Uses bcrypt to compare passwords.
 * - Generates new access and refresh tokens and updates the user record.
 * - Logs the action and returns tokens and user details.
 */
async function login({ email, password }) {
  const user = await User.findOne({ email });
  if (!user) {
    await logAction("login attempt", email, "failed");
    throw new Error("Invalid credentials.");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    await logAction("login attempt", email, "failed");
    throw new Error("Invalid credentials.");
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  user.activeToken = accessToken;
  user.refreshToken = refreshToken;
  await user.save();

  await logAction("login", email, "success");
  return { accessToken, refreshToken, user };
}

/**
 * Logs out a user.
 * - Clears both the activeToken and refreshToken fields in the database.
 * - Logs the action.
 */
async function logout(userId) {
  try {
    console.log("Logout initiated for user ID:", userId);
    const user = await User.findById(userId);
    if (!user) {
      console.log("User not found during logout.");
      await logAction("logout", "unknown", "failed");
      throw new Error("User not found.");
    }
    user.activeToken = null;
    user.refreshToken = null;
    await user.save();
    console.log("Logout successful for user:", user.email);
    await logAction("logout", user.email, "success");
  } catch (err) {
    console.error("Error during logout:", err.message);
    throw new Error("Logout failed.");
  }
}

/**
 * Middleware to verify the access token.
 * - Extracts the token from the Authorization header.
 * - Verifies the token and fetches the user from the database.
 * - Ensures the token matches the active token stored for the user.
 * - Attaches the full user object (including role) to req.user.
 */
async function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token payload:", decoded);
    const user = await User.findById(decoded.id);
    if (!user || user.activeToken !== token) {
      console.log("Token mismatch or user not found.");
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    req.user = user;
    console.log("Authenticated user attached to req.user:", req.user);
    next();
  } catch (err) {
    console.error("Error in token verification:", err.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * Generic middleware to check if the authenticated user has one of the allowed roles.
 * @param {Array} allowedRoles - Array of roles permitted access.
 */
function checkRoles(allowedRoles = []) {
  return (req, res, next) => {
    console.log("User role:", req.user.role);
    console.log("Allowed roles:", allowedRoles);
    if (!allowedRoles.includes(req.user.role)) {
      console.log("Access denied: User role does not match allowed roles.");
      return res.status(403).json({ error: "Forbidden: You do not have access to this resource." });
    }
    next();
  };
}

/**
 * Refreshes the access token using a valid refresh token.
 * - Verifies the refresh token using JWT_REFRESH_SECRET.
 * - Checks that the provided refresh token matches the one stored in the database.
 * - Generates a new access token, updates the user record, and returns the new token.
 */
async function refreshAccessToken(refreshToken) {
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      throw new Error("Invalid refresh token");
    }
    const newAccessToken = generateAccessToken(user);
    user.activeToken = newAccessToken;
    await user.save();
    return newAccessToken;
  } catch (err) {
    throw new Error("Invalid or expired refresh token");
  }
}

module.exports = {
  generateToken,
  generateAccessToken,
  generateRefreshToken,
  register,
  login,
  logout,
  verifyToken,
  checkRoles,
  refreshAccessToken,
};
