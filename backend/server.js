require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoose = require("mongoose");
const http = require("http");
const socketIo = require("socket.io");

// Import auth routes and controllers
const authRoutes = require("./routes/authRoutes");
const initializeSocket = require("./controllers/socketController");
const { verifyToken } = require("./controllers/authController");

const app = express();

// Apply security and parsing middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

// Connect to MongoDB with recommended options
mongoose
  .connect(process.env.URL)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Mount authentication routes under '/auth'
app.use("/auth", authRoutes);

// A simple test route for quick checks
app.get("/", (req, res) => {
  res.send("HelloMF");
});

// Protected route example using the verifyToken middleware.
// This route returns a message including the authenticated user's email.
app.get("/protected", verifyToken, (req, res) => {
  res.json({ message: `Hello, ${req.user.email}! Your route is protected.` });
});

// Catch-all handler for undefined routes (404 response)
app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

// Create an HTTP server from the Express app for Socket.IO functionality.
const server = http.createServer(app);

// Initialize Socket.IO with basic CORS settings.
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Initialize Socket.IO event handling using an external controller.
initializeSocket(io);

// Start the server on the designated port.
const PORT = process.env.PORT || 5020;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
