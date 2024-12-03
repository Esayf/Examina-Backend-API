import { ParticipatedUserDocument } from "../types";
import ParticipatedUser from "../models/participatedUser.model";
import User from "../models/user.model";
import Exam from "../models/exam.model";

interface ParticipationResult {
	success: boolean;
	status: number;
	message: string;
}

interface ParticipationOptions {
	createIfNotExist: boolean;
}

async function get(userId: string, examId: string): Promise<ParticipatedUserDocument | null> {
	try {
		const userParticipation = await ParticipatedUser.findOne({
			user: userId,
			exam: examId,
		});
		return userParticipation;
	} catch (err) {
		console.error("Error fetching participation:", err);
		throw new Error("Error fetching participation");
	}
}

async function getByWalletAddressAndQuizContractAddress(
	walletAddress: string,
	contractAddress: string
): Promise<ParticipatedUserDocument | null> {
	try {
		const user = await User.findOne({ walletAddress: walletAddress });
		const exam = await Exam.findOne({ contractAddress: contractAddress });

		if (!user || !exam) {
			throw new Error("User or Exam not found");
		}

		const userParticipation = await ParticipatedUser.findOne({
			user: user._id,
			exam: exam._id,
		});
		return userParticipation;
	} catch (err) {
		console.error("Error fetching participation:", err);
		throw new Error("Error fetching participation");
	}
}

async function create(userId: string, examId: string): Promise<void> {
	try {
		const newParticipatedUser = new ParticipatedUser({
			user: userId,
			exam: examId,
			isFinished: false,
		});
		await newParticipatedUser.save();
	} catch (err) {
		console.error("Error creating participation:", err);
		throw new Error("Error creating participation");
	}
}

async function checkParticipation(
	userId: string,
	examId: string,
	options: ParticipationOptions
): Promise<ParticipationResult> {
	try {
		const participatedUser = await get(userId, examId);

		if (!participatedUser) {
			if (options.createIfNotExist) {
				await create(userId, examId);
				return {
					success: true,
					status: 201,
					message: "Exam participation created successfully",
				};
			}
			return {
				success: false,
				status: 404,
				message: "User has not participated in the exam",
			};
		}

		if (participatedUser.isFinished) {
			return {
				success: false,
				status: 400,
				message: "User has already finished the exam",
			};
		}

		return { success: true, status: 200, message: "Continue the exam" };
	} catch (err) {
		console.error("Error in participation check: ", err);
		throw new Error("Error checking participation");
	}
}

async function updateParticipationStatus(userId: string, examId: string, isWinner: boolean): Promise<void> {
	try {
		const participatedUser = await get(userId, examId);

		if (!participatedUser) {
			throw new Error(`Participation not found for userId: ${userId} and examId: ${examId}`);
		}
		participatedUser.isFinished = true;
		participatedUser.isWinner = isWinner;
		await participatedUser.save();
	} catch (err) {
		console.error("Error updating participation:", err);
		throw new Error("Error updating participation");
	}
}

async function updateParticipatedUserRewardStatusByWalletAndContractAddress(
	walletAddress: string,
	contractAddress: string,
	isRewardSent: boolean,
	rewardAmount: string | null,
	rewardSentDate: Date | null
): Promise<void> {
	try {
		const participatedUser = await getByWalletAddressAndQuizContractAddress(walletAddress, contractAddress);
		if (!participatedUser) {
			throw new Error(
				`Participation not found for walletAddress: ${walletAddress} and contractAddress: ${contractAddress}`
			);
		}
		participatedUser.isRewardSent = isRewardSent;
		participatedUser.rewardAmount = rewardAmount ? parseFloat(rewardAmount) : null;
		participatedUser.rewardSentDate = rewardSentDate;
		await participatedUser.save();
	} catch (err) {
		console.error("Error updating participation reward status:", err);
		throw new Error("Error updating participation reward status");
	}
}

export default {
	get,
	create,
	checkParticipation,
	updateParticipationStatus,
	updateParticipatedUserRewardStatusByWalletAndContractAddress,
};
