declare module "connect-mongodb-session" {
	import session from "express-session";

	function ConnectMongoDBSession(session: typeof import("express-session")): new (options: any) => session.Store;

	export = ConnectMongoDBSession;
}
