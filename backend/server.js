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
app.use(rateLimit({ 
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // Temporarily increased to handle debugging
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
}));
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000'];
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET','POST','PUT','DELETE','OPTIONS','PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(express.json());

// Handle preflight requests for all routes
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.status(200).end();
    return;
  }
  next();
});

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
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
