const ParticipatedUser = require("../models/ParticipatedUser");

async function get(userId, examId) {
	try {
		const userParticipation = await ParticipatedUser.findOne({
			user: userId,
			exam: examId,
		});
		return userParticipation;
	} catch (err) {
		console.error("Error fetching participation:", err);
		return { status: 500, message: "Error fetching participation" };
	}
}

async function create(userId, examId) {
	try {
		const newParticipatedUser = new ParticipatedUser({
			user: userId,
			exam: examId,
			isFinished: false,
		});
		await newParticipatedUser.save();
	} catch (err) {
		console.error("Error creating participation:", err);
		return { status: 500, message: "Error creating participation" };
	}
}

// async function checkParticipationToStartExam(userId, examId) {
// 	let participatedUser = await get(userId, examId);

// 	if (participatedUser) {
// 		if (participatedUser.isFinished) {
// 			return {
// 				status: 400,
// 				message: "User has already finished the exam.",
// 			};
// 		}
// 		return { status: 200, message: "Continue the exam" };
// 	} else {
// 		await create(userId, examId);
// 		return {
// 			status: 200,
// 			message: "Exam participation updated successfully",
// 		};
// 	}
// }

// async function checkParticipationForQuestions(userId, examId) {
// 	const participatedUser = await get(userId, examId);
// 	if (!participatedUser) {
// 		return {
// 			status: 404,
// 			message: "User has not participated in the exam",
// 		};
// 	}
// 	if (participatedUser.isFinished) {
// 		return {
// 			status: 400,
// 			message: "User has already finished the exam",
// 		};
// 	}
// }

async function checkParticipation(
	userId,
	examId,
	options = { createIfNotExist: false }
) {
	const participatedUser = await get(userId, examId);

	if (!participatedUser) {
		if (options.createIfNotExist) {
			// Create new participation if the flag is set
			await create(userId, examId);
			return {
				success: true,
				status: 200,
				message: "Exam participation created successfully",
			};
		} else {
			// Return error if participation is required but not found
			return {
				success: false,
				status: 404,
				message: "User has not participated in the exam",
			};
		}
	}

	// Check if the user has finished the exam
	if (participatedUser.isFinished) {
		return {
			success: false,
			status: 400,
			message: "User has already finished the exam",
		};
	}

	// Return a success response if participation exists and is not finished
	return { success: true, status: 200, message: "Continue the exam" };
}

module.exports = {
	get,
	create,
	checkParticipation,
};
