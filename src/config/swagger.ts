import expressJSDocSwagger from "express-jsdoc-swagger";

const options = {
	info: {
		version: "1.0.0",
		title: "Choz API",
		description: "API Documentation for Choz Platform",
		license: {
			name: "MIT",
		},
	},
	security: {
		BearerAuth: {
			type: "http",
			scheme: "bearer",
		},
	},
	baseDir: __dirname,
	filesPattern: "../**/*.ts",
	swaggerUIPath: "/api-docs",
	exposeSwaggerUI: true,
	exposeApiDocs: false,
	apiDocsPath: "/v3/api-docs",
	notRequiredAsNullable: false,
	swaggerUiOptions: {},
};

export const setupSwagger = (app: any) => {
	expressJSDocSwagger(app)(options);
};
