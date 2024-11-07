import nodemailer from "nodemailer";
import { ParticipatedUserWithPopulatedUser } from "./types/participatedUser";

export const transporter = nodemailer.createTransport({
	host: process.env.SMTP_HOST,
	port: Number(process.env.SMTP_PORT),
	secure: false,
	auth: {
		user: process.env.SMTP_USER,
		pass: process.env.SMTP_PASS,
	},
});

export async function sendExamResultEmail(participated: ParticipatedUserWithPopulatedUser): Promise<void> {
	try {
		if (!participated.user.email) {
			throw new Error("User email not found");
		}

		const mailOptions = {
			from: process.env.SMTP_FROM,
			to: participated.user.email,
			subject: "Your Exam Results",
			html: `
        <h1>Exam Results</h1>
        <p>Your exam has been completed and graded.</p>
        <p>Please check your results on the platform.</p>
        `,
		};

		await transporter.sendMail(mailOptions);
	} catch (error) {
		console.error("Error sending email:", error);
		throw new Error("Failed to send email");
	}
}
