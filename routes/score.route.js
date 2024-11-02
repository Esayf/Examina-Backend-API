const express = require("express");
const router = express.Router();
const scoreController = require("../controllers/score.controller");
const {
	ensureAuthenticated,
	ensureAdminAccess,
} = require("../middleware/middleware");

router.get("/allScores", ensureAdminAccess, scoreController.getAllScores);
router.get("/:examId", ensureAuthenticated, scoreController.getScoresByExamId);

module.exports = router;
