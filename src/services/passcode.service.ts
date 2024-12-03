import { PasscodeDocument } from "../types";
import Passcode from "@/models/passcode.model";
import * as workerAPI from "../zkcloudworker/workerAPI";

async function create(examId: string, passcode: string): Promise<PasscodeDocument> {
	try {
		const newPasscode = new Passcode({
			exam: examId,
			passcode: passcode,
		});
		return await newPasscode.save();
	} catch (error) {
		console.error("Error saving passcode:", error);
		throw new Error("Error saving passcode");
	}
}

async function get(passcode: string): Promise<PasscodeDocument | null> {
	try {
		const passcodeObject = await Passcode.findOne({ passcode: passcode });
		return passcodeObject;
	} catch (error) {
		console.error("Error getting passcode:", error);
		throw new Error("Error getting passcode");
	}
}

async function validate(passcode: string): Promise<boolean> {
	try {
		let passcodeObject = await get(passcode);
		if (!passcodeObject) {
			return false;
		} else if (passcodeObject.isUsed) {
			return false;
		}
		passcodeObject.isUsed = true;
		await passcodeObject.save();
		return true;
	} catch (error) {
		console.error("Error during passcode validation:", error);
		throw new Error("Error during passcode validation");
	}
}

export default { create, get, validate };
