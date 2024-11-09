declare module "node-cron" {
	namespace cron {
		function schedule(
			expression: string,
			func: () => void,
			options?: {
				scheduled?: boolean;
				timezone?: string;
			}
		): ScheduledTask;

		interface ScheduledTask {
			start: () => void;
			stop: () => void;
			destroy: () => void;
		}
	}

	export = cron;
}
