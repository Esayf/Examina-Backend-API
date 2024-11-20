import answerService from "../services/answer.service.js";
async function getAnswers(req, res) {
    try {
        const { examId } = req.body;
        const userId = req.session.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const answers = await answerService.get(userId, examId);
        if (!answers) {
            return res.status(404).json({ message: "Answers not found" });
        }
        return res.status(200).json(answers);
    }
    catch (err) {
        console.error("Error fetching answers: ", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}
async function getAnswerById(req, res) {
    try {
        const { answerId } = req.params;
        const answer = await answerService.getById(answerId);
        if (!answer) {
            return res.status(404).json({ message: "Answer not found" });
        }
        return res.status(200).json(answer);
    }
    catch (error) {
        console.error("Error fetching answer: ", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
export default {
    getAnswers,
    getAnswerById,
};
