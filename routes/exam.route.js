const express = require("express");
const router = express.Router();
const examController = require("../controllers/exam.controller");
const { ensureAuthenticated } = require("../middleware/middleware");

router.use((req, res, next) => {
	ensureAuthenticated(req, res, next);
});

router.post("/create", examController.createExam);
router.get("/my-exams", examController.getAllExams);
router.get("/:id", examController.getExamById);

module.exports = router;
