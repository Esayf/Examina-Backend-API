import Exam from "../models/exam.model.js";
import Question from "../models/question.model.js";
import participatedUserService from "./participatedUser.service.js";
import answerService from "./answer.service.js";
import { calculateScore, checkExamTimes, processQuestion } from "../helpers/helperFunctions.cjs";
import scoreService from "./score.service.js";
async function create(examData, questions) {
    try {
        const exam = new Exam(examData);
        const savedExam = await exam.save();
        await saveQuestions(questions, savedExam.id);
        return savedExam;
    }
    catch (error) {
        console.error("Error creating exam:", error);
        throw new Error("Error creating exam");
    }
}
async function saveQuestions(questions, examId) {
    try {
        // Process each question before saving
        const processedQuestions = await Promise.all(questions.map((question) => processQuestion(question)));
        // Save each processed question with a reference to the exam
        const savedQuestions = await Promise.all(processedQuestions.map((question) => {
            question.exam = examId;
            return new Question(question).save();
        }));
        return savedQuestions;
    }
    catch (error) {
        console.error("Error saving questions:", error);
        throw new Error("Error saving questions");
    }
}
async function getAllByUser(userId) {
    try {
        return await Exam.find({ creator: userId });
    }
    catch (error) {
        console.error("Error fetching exams:", error);
        throw new Error("Error fetching exams");
    }
}
async function getById(examId) {
    try {
        return await Exam.findById(examId);
    }
    catch (error) {
        console.error("Error fetching exam:", error);
        throw new Error("Error fetching exam");
    }
}
async function start(examId, userId) {
    try {
        const exam = await getById(examId);
        if (!exam) {
            return { status: 404, message: "Exam not found" };
        }
        const examTimeCheck = checkExamTimes(exam);
        if (!examTimeCheck.valid) {
            return {
                status: 400,
                message: examTimeCheck.message || "Invalid exam time",
            };
        }
        const participationResult = await participatedUserService.checkParticipation(userId, examId, {
            createIfNotExist: true,
        });
        return {
            status: participationResult.status,
            message: participationResult.message,
        };
    }
    catch (error) {
        console.error("Error starting exam:", error);
        throw new Error("Error starting exam");
    }
}
async function getAnswerKey(examId) {
    // Verify the exam exists
    const exam = await Exam.findById(examId);
    if (!exam) {
        throw new Error("Exam not found");
    }
    // Fetch questions related to the exam, selecting question number and correct answer, and sort by question number
    const questions = await Question.find({ exam: examId })
        .select("number correctAnswer") // Select question number and correct answer
        .sort({ number: 1 }); // Sort by question number in ascending order
    // Create the answer key array
    const answerKey = questions.map((question) => ({
        questionId: question.id,
        questionNumber: question.number,
        correctAnswer: question.correctAnswer,
    }));
    return answerKey;
}
async function finish(userId, examId, answers, walletAddress) {
    try {
        const exam = await getById(examId);
        if (!exam) {
            return { status: 404, message: "Exam not found" };
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
        await answerService.create(userId, examId, answers, walletAddress);
        const answerKey = await getAnswerKey(examId);
        // Calculate score
        const { score, correctAnswers } = calculateScore(answers, answerKey);
        console.log("Score: ", score);
        console.log("Correct Answers: ", correctAnswers);
        // Save the score
        await scoreService.createScore({
            user: userId,
            exam: examId,
            score: parseInt(score),
            totalQuestions: exam.questionCount,
            correctAnswers: correctAnswers,
        });
        await participatedUserService.updateParticipationStatus(userId, examId);
        return { status: 200, message: "Exam completed successfully" };
    }
    catch (error) {
        console.error("Error finishing exam:", error);
        throw new Error("Error finishing exam");
    }
}
export default {
    create,
    getAllByUser,
    getById,
    start,
    finish,
};
