const examService = require("../services/exam.service");

async function createExam(req, res) {
	try {
		const examData = {
			creator: req.session.user.userId,
			title: req.body.title,
			description: req.body.description,
			startDate: req.body.startDate,
			duration: req.body.duration,
			rootHash: req.body.rootHash,
			secretKey: req.body.secretKey,
			questions: req.body.questions,
		};

		const { newExam, questions } = await examService.create(
			examData,
			examData.questions
		);

		return res.status(200).json({
			message: "Exam created successfully",
			newExam,
			questions,
		});
	} catch (err) {
		console.error(err);
		return res.status(500).json({ message: "Internal server error" });
	}
}

async function getAllExams(req, res) {
	try {
		const exams = await examService.getAllByUser(req.session.user.userId);
		res.status(200).json(exams);
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: "Internal Server Error" });
	}
}

async function getExamById(req, res) {
	try {
		const result = await examService.getByIdWithParticipation(
			req.params.id,
			// Unnecessary Control?
			req.session.user ? req.session.user.userId : null
		);
		res.status(200).json(result);
	} catch (err) {
		if (err.message === "Exam not found") {
			return res.status(404).json({ message: "Exam not found" });
		}
		console.error(err);
		res.status(500).json({ message: "Internal Server Error" });
	}
}

module.exports = {
	createExam,
	getAllExams,
	getExamById,
};
