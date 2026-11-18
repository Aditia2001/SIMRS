const express = require("express");
const controller = require("../controllers/labController");

const router = express.Router();

router.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Laboratory integration is healthy.",
    data: {
      service: "laboratory-integration",
      status: "healthy",
    },
  });
});

router.get("/requests", controller.getAllRequests);
router.get("/requests/:id", controller.getRequestById);
router.post("/results", controller.submitResult);

module.exports = router;
