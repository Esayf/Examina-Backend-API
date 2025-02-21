import { generatePinCode } from "@/helpers/helperFunctions";
import Pincode from "@/models/pincode.model";
import { PincodeDocument } from "@/typings";

async function createPincodeForExam(examId: string): Promise<PincodeDocument> {
	try {
		let pincode;

		while (true) {
			pincode = generatePinCode();
			const existingPincodeDoc = await Pincode.findOne({ pincode }).populate("exam");

			if (!existingPincodeDoc || existingPincodeDoc.exam._id === examId) {
				break;
			}

			if (existingPincodeDoc.exam.isCompleted) {
				await existingPincodeDoc.updateOne({ exam: examId });
				return existingPincodeDoc;
			}
		}
		const pincodeDoc = new Pincode({ exam: examId, pincode: pincode });

		return await pincodeDoc.save();
	} catch (error) {
		console.error("Error creating pincode for exam: ", error);
		throw new Error("Error creating pincode for exam");
	}
}

export default {
	createPincodeForExam,
};
