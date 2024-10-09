var nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

const htmlFilePath = path.join(__dirname, "quiz-results.html");
let htmlContent = fs.readFileSync(htmlFilePath, "utf-8");

const transporter = nodemailer.createTransport({
	host: "smtpout.secureserver.net",
	secure: true,
	tls: {
		ciphers: "SSLv3",
	},
	requireTLS: true,
	port: 465,
	debug: true,
	auth: {
		user: "info@choz.io",
		pass: `${process.env.MAIL_PASSWORD}`,
	},
	secureConnection: false,
});

async function sendExamResultEmail(
	userEmail,
	examName,
	totalQuestions,
	correctAnswers
) {
	try {
		if (!correctAnswers || correctAnswers === "User score not found") {
			console.log("User score is undefined, not sending email.");
			return;
		}

		htmlContent = htmlContent
			.replace("{{examName}}", examName)
			.replace("{{score}}", (correctAnswers / totalQuestions) * 100)
			.replace("{{correctAnswers}}", correctAnswers)
			.replace("{{totalQuestions}}", totalQuestions);

		let info = await transporter.sendMail({
			from: '"Choz Support" <info@choz.io>',
			to: userEmail,
			subject: "Your Quiz Results from Choz!",
			html: htmlContent,
		});

		console.log("Message sent: %s", info.messageId);
	} catch (error) {
		console.error("Error sending email:", error);
	}
}

module.exports = { transporter, sendExamResultEmail };
