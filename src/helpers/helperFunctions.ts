import crypto from "crypto";
import { ExamDocument, Answer, ProcessedAnswer } from "../types";

export function generateAnswerArray(answers: Answer[], walletAddress: string): ProcessedAnswer[] {
	return answers.map((answer) => {
		const hashInput = walletAddress + JSON.stringify(answer.answer);
		const answerHash = crypto.createHash("sha256").update(hashInput).digest("hex");
		return {
			question: answer.questionID,
			selectedOption: answer.answer,
			answerHash: answerHash,
		};
	});
}

export function isExamCompleted(exam: ExamDocument): boolean {
	const startTime = new Date(exam.startDate);
	const endTime = startTime.getTime() + exam.duration * 60000;
	const currentDateTime = new Date().getTime();
	return endTime < currentDateTime;
}

export function checkExamTimes(exam: ExamDocument): {
	valid: boolean;
	message?: string;
} {
	const now = new Date().getTime();
	const startTime = new Date(exam.startDate).getTime();
	const endTime = startTime + exam.duration * 60000;

	if (now < startTime) {
		return {
			valid: false,
			message: "Exam has not started yet",
		};
	}

	if (now > endTime) {
		return {
			valid: false,
			message: "Exam has ended",
		};
	}

	return { valid: true };
}
