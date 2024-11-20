import mongoose, { Document, Schema } from "mongoose";

interface CounterDocument extends Document {
	_id: string;
	seq: number;
}

const CounterSchema = new Schema({
	_id: {
		type: String,
		required: true,
	},
	seq: {
		type: Number,
		default: 0,
	},
});

export default mongoose.model<CounterDocument>("Counter", CounterSchema);
