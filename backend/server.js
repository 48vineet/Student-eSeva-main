const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");
const { port } = require("./config/env");
const errorHandler = require("./utils/errorHandler");

const app = express();
connectDB();

app.use(helmet());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // allow frontend origins
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// Routes
app.use("/api/upload", require("./routes/uploadRoutes"));
app.use("/api/students", require("./routes/studentRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/config", require("./routes/configRoutes"));

app.get("/health", (req, res) =>
  res.json({ status: "OK", timestamp: Date.now() })
);

app.get("/api/health", (req, res) =>
  res.json({ status: "OK", timestamp: Date.now() })
);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
