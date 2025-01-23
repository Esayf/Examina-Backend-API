import examService from "@/services/exam.service";
import { sendWinnerlist } from "@/mailer";
import User from "@/models/user.model";
import { ExtendedExamDocument, Winner } from "@/typings";

export type WinnerlistMailData = {
	examId: string | undefined;
	creatorMail: string | undefined;
	winnerlist: Winner[];
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

			const winners = await examService.getWinnerlist(examId);

			console.log(`Exam ID: ${examId}, Winner Wallets: `, winners);

			const winnerlistData: WinnerlistMailData = {
				examId: examId.toString(),
				creatorMail: creator.email,
				winnerlist: winners,
			};

			console.log("Winnerlist Data: ", winnerlistData);

			await sendWinnerlist(winnerlistData);
		}
	} catch (error) {
		console.error("Error sending winnerlist mail to creator: ", error);
	}
}

export default sendWinnerlistToCreator;
