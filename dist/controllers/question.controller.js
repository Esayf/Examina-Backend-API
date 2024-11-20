import questionService from "../services/question.service.js";
async function getQuestionById(req, res) {
    const { questionId } = req.params;
    try {
        const question = await questionService.getById(questionId);
        if (!question) {
            return res.status(404).json({ message: "Question not found" });
        }
        return res.status(200).json(question);
    }
    catch (error) {
        console.error("Error fetching question: ", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
async function getExamQuestions(req, res) {
    const userId = req.session.user?.userId;
    const { examId } = req.params;
    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    try {
        const response = await questionService.getAllByExam(examId, userId);
        return res.status(response.status).json(response.data || { message: response.message });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({
            message: "Internal Server Error",
        });
    }
}
export default {
    getQuestionById,
    getExamQuestions,
};
