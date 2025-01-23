declare module "memorystore" {
	import session from "express-session";

	function MemoryStore(session: typeof import("express-session")): new (options: any) => session.Store;

	export = MemoryStore;
}
