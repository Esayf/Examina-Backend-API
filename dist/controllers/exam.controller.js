import examService from "../services/exam.service.js";
async function createExam(req, res) {
    try {
        const examData = req.body;
        const userId = req.session.user?.userId;
        const questions = req.body.questions;
        const exam = await examService.create({
            ...examData,
            creator: userId,
            startDate: new Date(examData.startDate),
        }, questions);
        return res.status(201).json(exam);
    }
    catch (err) {
        console.error("Error creating exam:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
}
async function getAllExams(req, res) {
    try {
        const userId = req.session.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const exams = await examService.getAllByUser(userId);
        return res.status(200).json(exams);
    }
    catch (err) {
        console.error("Error fetching exams:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
}
async function getExamById(req, res) {
    try {
        const { id } = req.params;
        const exam = await examService.getById(id);
        if (!exam) {
            return res.status(404).json({ message: "Exam not found" });
        }
        return res.status(200).json(exam);
    }
    catch (err) {
        console.error("Error fetching exam:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
}
async function startExam(req, res) {
    try {
        const { examId } = req.body;
        const userId = req.session.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const { status, message } = await examService.start(examId, userId);
        return res.status(status).json({ message });
    }
    catch (err) {
        console.error("Error starting exam:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}
async function finishExam(req, res) {
    try {
        const { examId, answers } = req.body;
        const userId = req.session.user?.userId;
        const walletAddress = req.session.user?.walletAddress;
        if (!userId || !walletAddress) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const result = await examService.finish(userId, examId, answers, walletAddress);
        return res.status(result.status).json({ message: result.message });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Error finishing exam and submitting answers" });
    }
}
export default {
    createExam,
    getAllExams,
    getExamById,
    startExam,
    finishExam,
};
