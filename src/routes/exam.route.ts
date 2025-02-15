import express from "express";
import examController from "../controllers/exam.controller";
import { ensureAuthenticated } from "../middleware/middleware";
import { validateRequest } from "../middleware/validators";
import { examSchemas } from "../schemas/exam.schema";

const router = express.Router();

router.use(ensureAuthenticated);

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
router.post("/create", validateRequest({ body: examSchemas.createExam }), examController.createExam);

router.post("/generateExamLinks", validateRequest({ body: examSchemas.generateLinks }), examController.generateLinks);

/**
 * GET /exams/myExams
 * @tags Exam
 * @summary Get all exams for the authenticated user
 * @security BearerAuth
 * @return {array<ExamInput>} 200 - Success response
 * @return {object} 401 - Unauthorized
 * @return {object} 500 - Server error
 */
router.get("/myExams", validateRequest({ query: examSchemas.myExamsQueryParams }), examController.getAllExamsByUser);

router.get("/:id", validateRequest({ params: examSchemas.params }), examController.getExamById);
router.get("/:id/details", validateRequest({ params: examSchemas.params }), examController.getExamDetails);
router.post("/startExam", validateRequest({ body: examSchemas.startExam }), examController.startExam);
router.post("/finishExam", validateRequest({ body: examSchemas.finishExam }), examController.finishExam);

/**
 * @swagger
 * /exams/{id}/status:
 *   patch:
 *     summary: Update exam status (for flexible exams)
 *     tags: [Exams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, passive]
 *     responses:
 *       200:
 *         description: Exam status updated successfully
 *       400:
 *         description: Invalid request or exam is not flexible
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - only creator can change status
 *       404:
 *         description: Exam not found
 */
router.patch(
	"/:id/status",
	ensureAuthenticated,
	validateRequest(examSchemas.updateStatus),
	examController.updateStatus
);

export default router;
