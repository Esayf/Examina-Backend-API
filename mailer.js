var nodemailer = require("nodemailer");

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

async function sendExamResultEmail(userEmail, examName, examId, score) {
	try {
		let info = await transporter.sendMail({
			from: '"Choz Support" <info@choz.io>', // Gönderen
			to: userEmail, // Alıcı
			subject: `Your Exam Results for ${examName} (Id: ${examId})`, // Konu
			text: `Dear Student, your score for the exam "${examName}" (Id: ${examId}) is ${score}.`, // Düz metin içeriği
			html: `<b>Dear Student,</b><br>Your score for the exam "<b>${examName}</b>" is <b>${score}</b>.`, // HTML içeriği
		});

		console.log("Message sent: %s", info.messageId);
	} catch (error) {
		console.error("Error sending email:", error);
	}
}

// transporter ve sendExamResultEmail fonksiyonunu dışa aktarma
module.exports = { transporter, sendExamResultEmail };
