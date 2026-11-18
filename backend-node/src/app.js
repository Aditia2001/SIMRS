require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const labRoutes = require("./routes/labRoutes");

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);

app.use(express.json());

app.get("/api/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "SIMRS Node.js API running successfully",
    data: {
      service: "laboratory-integration",
      status: "healthy",
    },
  });
});

app.use("/api/lab", labRoutes);

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "Endpoint tidak ditemukan.",
  });
});

app.use((error, req, res, next) => {
  console.error(error);

  return res.status(error.status || 500).json({
    success: false,
    message:
      error.status && error.status < 500
        ? error.message
        : "Terjadi kesalahan pada server.",
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Node API running at http://localhost:${PORT}`);
});
