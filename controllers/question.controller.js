const questionService = require("../services/question.service");

async function getQuestionById(req, res) {
	const { questionId } = req.params;

	try {
		const question = await questionService.getById(questionId);
		if (!question) {
			return res.status(404).json({ message: "Question not found" });
		}

		return res.status(200).json(question);
	} catch (error) {
		console.error("Error fetching question: ", error);
		return res.status(500).json({ message: "Internal server error" });
	}
}

module.exports = {
	getQuestionById,
};
