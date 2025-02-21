import express from "express";
import pincodeController from "@/controllers/pincode.controller";
import { validateRequest } from "@/middleware/validators";
import { pincodeSchemas } from "@/schemas/pincode.schema";

const router = express.Router();

router.get("/:pincode", validateRequest({ params: pincodeSchemas.params }), pincodeController.getExamIdByPinCode);

export default router;
