import { ExamDocument } from "../types";
import { checkTwitterFollow } from "@/integrations/social/twitter";
import { checkDiscordRole } from "@/integrations/social/discord";
import SocialConnection from "../models/socialConnection.model";

interface RequirementResult {
	success: boolean;
	message?: string;
}

export async function verifyExamRequirements(exam: ExamDocument, userId: string): Promise<RequirementResult> {
	if (!exam.requirements || exam.requirements.length === 0) {
		return { success: true };
	}

	const socialConnections = await SocialConnection.find({ user: userId });

	for (const req of exam.requirements) {
		switch (req.type) {
			case "twitterFollow": {
				const twitterConn = socialConnections.find((conn) => conn.platform === "twitter");
				if (!twitterConn) {
					return {
						success: false,
						message: `Please connect your Twitter account first`,
					};
				}

				const followCheck = await checkTwitterFollow(twitterConn, req.data.twitterHandle!);
				if (!followCheck) {
					return {
						success: false,
						message: `You must follow @${req.data.twitterHandle} on Twitter`,
					};
				}
				break;
			}

			case "discordRole": {
				const discordConn = socialConnections.find((conn) => conn.platform === "discord");
				if (!discordConn) {
					return {
						success: false,
						message: "Please connect your Discord account first",
					};
				}

				const roleCheck = await checkDiscordRole(
					discordConn,
					req.data.discordServerId!,
					req.data.discordRoleId!
				);
				if (!roleCheck) {
					return {
						success: false,
						message: "Required Discord role not found",
					};
				}
				break;
			}
		}
	}

	return { success: true };
}
