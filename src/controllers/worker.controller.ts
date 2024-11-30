import { Response } from "express";
import { CustomRequest } from "../types";
import * as workerAPI from "../zkcloudworker/workerAPI";

export async function initWinnerMap(req: CustomRequest, res: Response) {
	try {
		const { contractAddress } = req.body;

		if (!contractAddress) {
			return res.status(400).json({ message: "Contract address is required" });
		}

		const result = await workerAPI.initWinnerMap({
			contractAddress,
		});

		return res.status(200).json(result);
	} catch (error) {
		console.error("Error in initWinnerMap:", error);
		return res.status(500).json({ message: "Internal server error" });
	}
}

export async function addWinner(req: CustomRequest, res: Response) {
	try {
		const { winner, previousProof, serializedPreviousMap, contractAddress } = req.body;

		if (!winner || !previousProof || !serializedPreviousMap || !contractAddress) {
			return res.status(400).json({
				message: "Winner, previous proof, serialized previous map, and contract address are required",
			});
		}

		const result = await workerAPI.addWinner(
			JSON.stringify({
				winner,
				previousProof,
				serializedPreviousMap,
				contractAddress,
			})
		);

		return res.status(200).json(result);
	} catch (error) {
		console.error("Error in addWinner:", error);
		return res.status(500).json({ message: "Internal server error" });
	}
}

export async function payoutWinners(req: CustomRequest, res: Response) {
	try {
		const { winner1, winner2, winner1Proof, winner2Proof, contractAddress } = req.body;

		if (!winner1 || !winner2 || !winner1Proof || !winner2Proof || !contractAddress) {
			return res.status(400).json({
				message: "Winners, proofs, and contract address are required",
			});
		}

		const result = await workerAPI.payoutWinners(
			JSON.stringify({
				winner1,
				winner2,
				winner1Proof,
				winner2Proof,
				contractAddress,
			})
		);

		return res.status(200).json(result);
	} catch (error) {
		console.error("Error in payoutWinners:", error);
		return res.status(500).json({ message: "Internal server error" });
	}
}

export async function calculateScore(req: CustomRequest, res: Response) {
	try {
		const { userAnswers, correctAnswers } = req.body;

		if (!userAnswers || !correctAnswers) {
			return res.status(400).json({ message: "User answers and correct answers are required" });
		}

		const result = await workerAPI.calculateScore({
			userAnswers,
			correctAnswers,
		});

		return res.status(200).json(result);
	} catch (error) {
		console.error("Error in calculateScore:", error);
		return res.status(500).json({ message: "Internal server error" });
	}
}

export async function initWinnerMapAddTwoWinnersAndPayout(req: CustomRequest, res: Response) {
	try {
		const { contractAddress, winner1, winner2 } = req.body;

		if (!contractAddress || !winner1 || !winner2) {
			return res.status(400).json({ message: "Contract address, winner1, and winner2 are required" });
		}

		const result = await workerAPI.initWinnerMapAddTwoWinnersAndPayout(
			JSON.stringify({ contractAddress, winner1, winner2 })
		);

		return res.status(200).json(result);
	} catch (error) {
		console.error("Error in initWinnerMapAddTwoWinnersAndPayout:", error);
		return res.status(500).json({ message: "Internal server error" });
	}
}
