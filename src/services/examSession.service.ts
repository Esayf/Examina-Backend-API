import { ExamSessionDocument } from "@/models/examSession.model";
import ExamSession from "@/models/examSession.model";
import Exam from "@/models/exam.model";
import { Types } from "mongoose";
import { BadRequestError, NotFoundError } from "@/utils/errors";

export class ExamSessionService {
	/**
	 * Start a new exam session for a participant
	 */
	async startSession(examId: string, userId: string): Promise<ExamSessionDocument> {
		const exam = await Exam.findById(examId);
		if (!exam) {
			throw new NotFoundError("Exam not found");
		}

		if (!exam.isFlexible && exam.isCompleted) {
			throw new BadRequestError("This exam has already ended");
		}

		if (exam.isFlexible && exam.status !== "active") {
			throw new BadRequestError("This exam is not currently active");
		}

		// Check for existing active session
		const existingSession = await ExamSession.findOne({
			examId: new Types.ObjectId(examId),
			userId: new Types.ObjectId(userId),
			isCompleted: false,
		});

		if (existingSession) {
			return existingSession;
		}

		// Create new session
		const timeLimit = exam.isFlexible ? exam.participantTimeLimit : exam.duration;

		return await ExamSession.create({
			examId: new Types.ObjectId(examId),
			userId: new Types.ObjectId(userId),
			remainingTime: timeLimit,
		});
	}

	/**
	 * Complete an exam session
	 */
	async completeSession(sessionId: string): Promise<ExamSessionDocument> {
		const session = await ExamSession.findById(sessionId);
		if (!session) {
			throw new NotFoundError("Session not found");
		}

		session.isCompleted = true;
		session.endTime = new Date();
		return await session.save();
	}

	/**
	 * Update remaining time for a session
	 */
	async updateRemainingTime(sessionId: string, remainingTime: number): Promise<ExamSessionDocument> {
		const session = await ExamSession.findById(sessionId);
		if (!session) {
			throw new NotFoundError("Session not found");
		}

		if (session.isCompleted) {
			throw new BadRequestError("Session is already completed");
		}

		session.remainingTime = Math.max(0, remainingTime);
		if (session.remainingTime === 0) {
			session.isCompleted = true;
			session.endTime = new Date();
		}

		return await session.save();
	}

	/**
	 * Get active session for a user in an exam
	 */
	async getActiveSession(examId: string, userId: string): Promise<ExamSessionDocument | null> {
		return await ExamSession.findOne({
			examId: new Types.ObjectId(examId),
			userId: new Types.ObjectId(userId),
			isCompleted: false,
		});
	}

	/**
	 * Get all active sessions for an exam
	 */
	async getExamActiveSessions(examId: string): Promise<ExamSessionDocument[]> {
		return await ExamSession.find({
			examId: new Types.ObjectId(examId),
			isCompleted: false,
		});
	}

	/**
	 * Clean up expired sessions
	 */
	async cleanupExpiredSessions(): Promise<void> {
		const expiredSessions = await ExamSession.find({
			isCompleted: false,
			remainingTime: 0,
		});

		for (const session of expiredSessions) {
			session.isCompleted = true;
			session.endTime = new Date();
			await session.save();
		}
	}
}
