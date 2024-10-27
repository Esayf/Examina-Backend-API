const scoreService = require("../services/score.service");
const examService = require("../services/exam.service");
const { isExamCompleted } = require("../helpers/helperFunctions");

async function getAllScores(req, res) {
	try {
		const scores = await scoreService.getAll();
		if (!scores) {
			return res.status(404).json({ message: "Sores not found" });
		}
		return res.status(200).json(scores);
	} catch (error) {
		console.error("Error fetching scores: ", error);
		return res.status(500).json({ message: "Internal Server Error" });
	}
}

async function getScoresByExamId(req, res) {
	const { examId } = req.params;
	const userId = req.session.user.userId;

	try {
		const exam = await examService.getById(examId);
		if (!exam) {
			return res.status(404).json({ message: "Exam not found" });
		}

		const isCompleted = isExamCompleted(exam);
		if (!isCompleted) {
			return res
				.status(400)
				.json({ message: "Exam is not completed yet" });
		}
		const creatorId = exam.creator.toString();
		if (userId.toString() !== creatorId) {
			return res.status(403).json({ message: "Unauthorized access" });
		}
		const examScores = await scoreService.getScoresByExamId(examId);
		return res.status(200).json(examScores);
	} catch (error) {
		console.error("Error fetching scores for exam:", error);
		return res.status(500).json({ message: "Internal Server Error" });
	}
}

module.exports = {
	getAllScores,
	getScoresByExamId,
};
