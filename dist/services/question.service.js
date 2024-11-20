import Question from "../models/question.model.js";
import participatedUserService from "./participatedUser.service.js";
import examService from "./exam.service.js";
import { checkExamTimes } from "../helpers/helperFunctions.cjs";
async function getById(questionId) {
    try {
        return await Question.findById(questionId);
    }
    catch (error) {
        console.error("Error fetching question:", error);
        throw new Error("Error fetching question");
    }
}
async function getAllByExam(examId, userId) {
    try {
        const exam = await examService.getById(examId);
        if (!exam) {
            return { status: 404, message: "Exam not found" };
        }
        const examTimeCheck = checkExamTimes(exam);
        if (!examTimeCheck.valid) {
            return { status: 400, message: examTimeCheck.message };
        }
        const participationResult = await participatedUserService.checkParticipation(userId, examId, {
            createIfNotExist: false,
        });
        if (!participationResult.success) {
            return {
                status: participationResult.status,
                message: participationResult.message,
            };
        }
        const questions = await Question.find({ exam: examId }).select("-correctAnswer").sort({ number: 1 });
        return { status: 200, data: questions };
    }
    catch (err) {
        console.error("Error fetching exam questions:", err);
        throw new Error("Error fetching exam questions");
    }
}
export default {
    getById,
    getAllByExam,
};
