/// <reference types="bun-types" />

declare module "bun" {
	interface Env {
		NODE_ENV: "development" | "production" | "test";
		PORT: string;
		MONGO_URI: string;
		REDIS_HOST: string;
		REDIS_PORT: string;
		SESSION_SECRET: string;
		SMTP_HOST: string;
		SMTP_PORT: string;
		SMTP_USER: string;
		SMTP_PASS: string;
		SMTP_FROM: string;
		ADMIN_PUBLIC_KEY: string;
	}
}

export {};
