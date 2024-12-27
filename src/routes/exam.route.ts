import express from "express";
import examController from "../controllers/exam.controller";
import { ensureAuthenticated, validateFinishExamBody } from "../middleware/middleware";

const router = express.Router();

/**
 * @typedef {object} ExamInput
 * @property {string} title.required - The title of the exam
 * @property {string} description.required - The description of the exam
 * @property {string} startDate.required - The start date of the exam
 * @property {number} duration.required - The duration in minutes
 * @property {string} rootHash.required - The root hash of the exam
 * @property {string} secretKey.required - The secret key of the exam
 * @property {number} questionCount.required - The number of questions
 */

/**
 * POST /exams/create
 * @tags Exam
 * @summary Create a new exam
 * @security BearerAuth
 * @param {ExamInput} request.body.required - Exam information
 * @return {object} 201 - Success response
 * @return {object} 401 - Unauthorized
 * @return {object} 500 - Server error
 */
router.post("/create", ensureAuthenticated, examController.createExam);

router.post("/generateExamLinks", ensureAuthenticated, examController.generateLinks);

/**
 * GET /exams/myExams
 * @tags Exam
 * @summary Get all exams for the authenticated user
 * @security BearerAuth
 * @return {array<ExamInput>} 200 - Success response
 * @return {object} 401 - Unauthorized
 * @return {object} 500 - Server error
 */
router.get("/myExams", ensureAuthenticated, examController.getAllExams);

router.get("/:id", examController.getExamById);
router.post("/startExam", ensureAuthenticated, examController.startExam);
router.post("/finishExam", ensureAuthenticated, validateFinishExamBody, examController.finishExam);

router.get("/isEligibleToJoin/:examId", ensureAuthenticated, examController.checkEligibility);

export default router;
