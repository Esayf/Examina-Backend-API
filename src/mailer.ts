import nodemailer, { Transporter } from "nodemailer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const htmlFilePath = path.join(__dirname, "../quiz-results.html");
let htmlContent = fs.readFileSync(htmlFilePath, "utf-8");

import SMTPTransport from "nodemailer/lib/smtp-transport"; // SMTP transport tipini içe aktar

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
	correctAnswers: number
): Promise<void> {
	try {
		if (!totalQuestions) {
			console.log("Exam is undefined, not sending email.");
			return;
		}

		const htmlBody = htmlContent
			.replace("{{examName}}", examName)
			.replace("{{score}}", ((+correctAnswers / totalQuestions) * 100).toFixed(2))
			.replace("{{correctAnswers}}", correctAnswers.toString())
			.replace("{{totalQuestions}}", totalQuestions.toString());

		const info = await transporter.sendMail({
			from: '"Choz Support" <info@choz.io>',
			to: userEmail,
			subject: "Your Quiz Results from Choz!",
			html: htmlBody,
		});

		console.log("Message sent: %s", info.messageId);
	} catch (error) {
		console.error("Error sending email:", error);
		throw new Error("Failed to send email");
	}
}

export { transporter, sendExamResultEmail };
