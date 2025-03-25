const mongoose = require("mongoose");

const logSchema = new mongoose.Schema({
  action: { type: String, required: true },
  email: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  status: { type: String, required: true } // e.g., "success" or "failed"
});

const Log = mongoose.model("Log", logSchema);
module.exports = Log;
