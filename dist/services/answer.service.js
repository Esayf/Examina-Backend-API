import AnswerModel from "../models/answer.model.js";
import { generateAnswerArray } from "../helpers/helperFunctions.cjs";
async function get(userId, examId) {
    try {
        const answer = await AnswerModel.findOne({ user: userId, exam: examId });
        return answer;
    }
    catch (error) {
        console.error("Error fetching answer: ", error);
        throw new Error("Error fetching answer");
    }
}
async function create(userId, examId, answers, walletAddress) {
    try {
        const userAnswers = new AnswerModel({
            user: userId,
            exam: examId,
            answers: generateAnswerArray(answers, walletAddress),
        });
        await userAnswers.save();
    }
    catch (error) {
        console.error("Error saving answer: ", error);
        throw new Error("Error saving answer");
    }
}
async function getById(answerId) {
    try {
        const answer = await AnswerModel.findById(answerId)
            .populate("user", "username walletAddress")
            .populate("exam", "title");
        return answer;
    }
    catch (error) {
        console.error("Error fetching answer:", error);
        throw new Error("Error fetching answer");
    }
}
export default {
    get,
    create,
    getById,
};
