import { PasscodeDocument } from "../types";
import Passcode from "@/models/passcode.model";

async function create(examId: string, passcode: string): Promise<PasscodeDocument> {
	try {
		const newPasscode = new Passcode({
			exam: examId,
			passcode: passcode,
		});
		return await newPasscode.save();
	} catch (err) {
		console.error("Error saving passcode: ", err);
		throw new Error("Error saving passcode");
	}
}

async function get(passcode: string): Promise<PasscodeDocument | null> {
	try {
		const passcodeObject = await Passcode.findOne({ passcode: passcode });
		return passcodeObject;
	} catch (err) {
		console.error("Error getting passcode: ", err);
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
	} catch (err) {
		console.error("Error during passcode validation: ", err);
		throw new Error("Error during passcode validation");
	}
}

export default { create, get, validate };
