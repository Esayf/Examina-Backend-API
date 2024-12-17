import examService from "@/services/exam.service";
import { sendWinnerlist } from "@/mailer";
import User from "@/models/user.model";
import { ExtendedExamDocument } from "@/types";

export type Winnerlist = {
	examId: string | undefined;
	creatorMail: string | undefined;
	winnerlist: string[];
};

async function sendWinnerlistToCreator(completedExams: ExtendedExamDocument[]) {
	try {
		for (const exam of completedExams) {
			const creator = await User.findById(exam.creator).select("email").lean();

			const examId = exam._id;

			if (!creator?.email) {
				console.log(`No creator email for exam ${examId}`);
				return;
			}

			const walletAddresses = await examService.getWinnerlist(examId);

			console.log(`Exam ID: ${examId}, Winner Wallets: `, walletAddresses);

			const winnerlistData: Winnerlist = {
				examId: examId.toString(),
				creatorMail: creator.email,
				winnerlist: walletAddresses,
			};

			console.log("Winnerlist Data: ", winnerlistData);

			await sendWinnerlist(winnerlistData);
		}
	} catch (error) {
		console.error("Error sending winnerlist mail to creator: ", error);
	}
}

export default sendWinnerlistToCreator;
