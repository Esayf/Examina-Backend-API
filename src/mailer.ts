import nodemailer, { Transporter } from "nodemailer";
import fs from "fs";
import path from "path";

const regularResultsHtmlPath = path.join(__dirname, "../quiz-results.html");
const winnerResultsHtmlPath = path.join(__dirname, "../winner-quiz-result-mail.html");

const regularHtmlContent = fs.readFileSync(regularResultsHtmlPath, "utf-8");
const winnerHtmlContent = fs.readFileSync(winnerResultsHtmlPath, "utf-8");

import SMTPTransport from "nodemailer/lib/smtp-transport"; // SMTP transport tipini içe aktar
import { Winnerlist } from "./cron/sendWinnerListToCreator";

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
			htmlBody = htmlBody.replace("{{rewardAmount}}", rewardAmount.toString());
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

async function sendGeneratedExamLink(examLink: string, participantEmail: string): Promise<void> {
	const subject = "Your magic link to join the quiz";
	const htmlBody = `<p>Click the link below to join the quiz:</p>
            <a href="${examLink}">${examLink}</a>
            <p>This link is valid for one-time use only.</p>`;

	const info = await transporter.sendMail({
		from: '"Choz Support" <info@choz.io>',
		to: participantEmail,
		subject: subject,
		html: htmlBody,
	});

	console.log("Message sent: %s", info.messageId);
}

async function sendWinnerlist(winnerlist: Winnerlist): Promise<void> {
	const subject = `Winnerlist of the exam ${winnerlist.examId}`;
	const htmlBody = `
<!DOCTYPE html>
<html>
<head>
    ...
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Congratulations!</h1>
        </div>
        <div class="content">
            <p>Dear Creator,</p>
            <p>We are excited to share the winner list for your exam:</p>
            <ul>
                ${winnerlist.winnerlist.map((address) => `<li>${address}</li>`).join("")}
            </ul>
            <p>Please ensure to process the rewards accordingly.</p>
        </div>
        <div class="footer">
            <p>&copy; 2024 Exam Platform. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;

	const info = await transporter.sendMail({
		from: '"Choz Support" <info@choz.io>',
		to: winnerlist.creatorMail,
		subject: subject,
		html: htmlBody,
	});
	console.log("Winnerlist message sent: %s", info.messageId);
}

export { transporter, sendExamResultEmail, sendGeneratedExamLink, sendWinnerlist };
