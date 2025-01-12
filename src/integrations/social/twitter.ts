import axios from "axios";
import { SocialConnectionDocument } from "../../types";

interface TwitterResponse {
	data?: any;
	errors?: Array<{ message: string }>;
}

async function refreshTwitterToken(refreshToken: string): Promise<{
	access_token: string;
	refresh_token: string;
}> {
	const basic = Buffer.from(`${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`).toString(
		"base64"
	);

	try {
		const response = await axios.post(
			"https://api.x.com/2/oauth2/token",
			new URLSearchParams({
				grant_type: "refresh_token",
				refresh_token: refreshToken,
			}).toString(),
			{
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
					Authorization: `Basic ${basic}`,
				},
			}
		);

		return {
			access_token: response.data.access_token,
			refresh_token: response.data.refresh_token,
		};
	} catch (error) {
		console.error("Error refreshing Twitter token:", error);
		throw new Error("Failed to refresh token");
	}
}

async function makeTwitterRequest(
	url: string,
	connection: SocialConnectionDocument,
	retried: boolean = false
): Promise<TwitterResponse> {
	try {
		const response = await axios.get(url, {
			headers: {
				Authorization: `Bearer ${connection.accessToken}`,
			},
		});

		return response.data;
	} catch (error: any) {
		if (error.response?.status === 401 && !retried && connection.refreshToken) {
			// Token expired, try refreshing
			const newTokens = await refreshTwitterToken(connection.refreshToken);

			// Update the connection with new tokens
			connection.accessToken = newTokens.access_token;
			connection.refreshToken = newTokens.refresh_token;
			await connection.save();

			// Retry the request with new token
			return makeTwitterRequest(url, connection, true);
		}

		throw error;
	}
}

export async function checkTwitterFollow(connection: SocialConnectionDocument, targetHandle: string): Promise<boolean> {
	try {
		// 1. Get authenticated user's ID
		const meResponse = await makeTwitterRequest("https://api.x.com/2/users/me", connection);

		if (meResponse.errors) {
			console.error("Error getting user info:", meResponse.errors[0].message);
			return false;
		}

		const userId = meResponse.data.id;

		// 2. Get target user's ID from username
		const userResponse = await makeTwitterRequest(
			`https://api.x.com/2/users/by/username/${targetHandle}`,
			connection
		);

		if (userResponse.errors) {
			console.error("Error getting target user:", userResponse.errors[0].message);
			return false;
		}

		const targetUserId = userResponse.data.id;

		// 3. Check if user follows target (corrected endpoint)
		const followingResponse = await makeTwitterRequest(
			`https://api.x.com/2/users/${userId}/following?user.fields=id&max_results=1000`,
			connection
		);

		if (followingResponse.errors) {
			console.error("Error checking following:", followingResponse.errors[0].message);
			return false;
		}

		// Check if target user is in the following list
		return followingResponse.data.some((user: any) => user.id === targetUserId);
	} catch (error) {
		console.error("Error checking Twitter follow status:", error);
		return false;
	}
}
