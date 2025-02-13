import { Response } from "express";
import { CustomRequest, PincodeDocument } from "@/typings";
import pincodeService from "@/services/pincode.service";
import Pincode from "@/models/pincode.model";

async function getExamIdByPinCode(req: CustomRequest, res: Response) {
	try {
		const { pincode } = req.params;
		const pincodeDocument = await Pincode.findOne({ pincode });
		if (!pincodeDocument) {
			return res.status(404).json({ message: "Pincode not found" });
		}
		const response = { examId: pincodeDocument.exam._id };
		return res.status(200).json(response);
	} catch (err) {
		console.error("Error fetching examId by pincode: ", err);
		return res.status(500).json({ message: "Internal server error" });
	}
}

export default {
	getExamIdByPinCode,
};
