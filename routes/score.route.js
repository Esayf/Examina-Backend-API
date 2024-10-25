const express = require("express");
const router = express.Router();
const scoreController = require("../controllers/score.controller");
const { ensureAuthenticated } = require("../middleware/middleware");

// TODO: admin auth
router.get("/allScores", scoreController.getAllScores);
router.get("/:examId", ensureAuthenticated, scoreController.getScoresByExamId);

module.exports = router;
