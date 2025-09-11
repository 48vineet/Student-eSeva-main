const mongoose = require("mongoose");
const { mongoUri } = require("./env");

function connectDB() {
  mongoose
    .connect(mongoUri)
    .then(() => console.log("MongoDB Atlas connected"))
    .catch((err) => {
      console.error("MongoDB connection error:", err);
      process.exit(1);
    });
}

module.exports = connectDB;
