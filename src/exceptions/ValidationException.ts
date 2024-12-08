interface ValidationError {
	field: string;
	message: string;
}

export class ValidationException extends Error {
	constructor(
		public message: string,
		public errors: ValidationError[]
	) {
		super(message);
		this.name = "ValidationException";
	}

	toJSON() {
		return {
			error: this.name,
			message: this.message,
			errors: this.errors,
		};
	}
}
