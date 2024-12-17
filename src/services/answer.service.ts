import { AnswerDocument, Answer } from "../types";
import AnswerModel from "../models/answer.model";
import { generateAnswerArray } from "../helpers/helperFunctions";

async function get(userId: string, examId: string): Promise<AnswerDocument | null> {
	try {
		const answer = await AnswerModel.findOne({ user: userId, exam: examId });
		return answer;
	} catch (error) {
		console.error("Error fetching answer: ", error);
		throw new Error("Error fetching answer");
	}
}

async function create(userId: string, examId: string, answers: Answer[], walletAddress: string): Promise<void> {
	try {
		const userAnswers = new AnswerModel({
			user: userId,
			exam: examId,
			answers: generateAnswerArray(answers, walletAddress),
		});
		await userAnswers.save();
	} catch (error) {
		console.error("Error saving answer: ", error);
		throw new Error("Error saving answer");
	}
}

async function getById(answerId: string): Promise<AnswerDocument | null> {
	try {
		const answer = await AnswerModel.findById(answerId)
			.populate("user", "username walletAddress")
			.populate("exam", "title");
		return answer;
	} catch (error) {
		console.error("Error fetching answer: ", error);
		throw new Error("Error fetching answer");
	}
}

export default {
	get,
	create,
	getById,
};
