const answerService = require("../services/answer.service");

async function getAnswers(req, res) {
	try {
		const examId = req.body.examId;
		const userId = req.session.user.userId;

		const answers = await answerService.get(userId, examId);

		if (!answers) {
			return res.status(404).json({ message: "Answers not found" });
		}

		return res.status(200).json(answers);
	} catch (err) {
		console.error("Error fetching answers: ", err);
		return res.status(500).json({ message: "Internal Server Error" });
	}
}

async function getAnswerById(req, res) {
	const { answerId } = req.params;

	try {
		const answer = await answerService.getById(answerId);
		if (!answer) {
			return res.status(404).json({ message: "Answer not found" });
		}
		return res.status(200).json(answer);
	} catch (error) {
		console.error("Error fetching answer: ", error);
		return res.status(500).json({ message: "Internal server error" });
	}
}

module.exports = { getAnswers, getAnswerById };
