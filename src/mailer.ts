import nodemailer, { Transporter } from "nodemailer";
import fs from "fs";
import path from "path";

const regularResultsHtmlPath = path.join(__dirname, "../quiz-results.html");
const winnerResultsHtmlPath = path.join(__dirname, "../winner-quiz-result-mail.html");

const regularHtmlContent = fs.readFileSync(regularResultsHtmlPath, "utf-8");
const winnerHtmlContent = fs.readFileSync(winnerResultsHtmlPath, "utf-8");

import SMTPTransport from "nodemailer/lib/smtp-transport"; // SMTP transport tipini içe aktar
import { formatMina } from "./helpers/helperFunctions";

const transporter: Transporter<SMTPTransport.Options> = nodemailer.createTransport({
	host: "smtpout.secureserver.net",
	port: 465,
	secure: true,
	auth: {
		user: "info@choz.io",
		pass: process.env.MAIL_PASSWORD || "",
	},
	tls: {
		ciphers: "SSLv3",
	},
	requireTLS: true,
	secureConnection: false,
} as SMTPTransport.Options);

async function sendExamResultEmail(
	userEmail: string,
	examName: string,
	totalQuestions: number,
	correctAnswers: number,
	isWinner: boolean,
	rewardAmount?: number
): Promise<void> {
	try {
		if (!totalQuestions) {
			console.log("Exam is undefined, not sending email.");
			return;
		}

		const score = ((correctAnswers / totalQuestions) * 100).toFixed(2);
		const templateContent = isWinner ? winnerHtmlContent : regularHtmlContent;

		let htmlBody = templateContent
			.replace("{{examName}}", examName)
			.replace("{{score}}", score)
			.replace("{{correctAnswers}}", correctAnswers.toString())
			.replace("{{totalQuestions}}", totalQuestions.toString());

		if (isWinner && rewardAmount) {
			htmlBody = htmlBody.replace("{{rewardAmount}}", formatMina(rewardAmount).toString());
		}

		const subject = isWinner ? "🎉 Congratulations! You're a Choz Quiz Winner! 🏆" : "Your Quiz Results from Choz!";

		const info = await transporter.sendMail({
			from: '"Choz Support" <info@choz.io>',
			to: userEmail,
			subject: subject,
			html: htmlBody,
		});

		console.log("Message sent: %s", info.messageId);
	} catch (error) {
		console.error("Error sending email:", error);
		throw new Error("Failed to send email");
	}
}

export { transporter, sendExamResultEmail };
