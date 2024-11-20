import { verifySignature } from "../helpers/helperFunctions.cjs";
export function ensureAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    return res.status(401).json({ message: "Unauthorized" });
}
export function ensureAdmin(req, res, next) {
    if (req.session?.user?.isAdmin) {
        return next();
    }
    return res.status(403).json({ message: "Admin access required" });
}
export function validateSessionToken(req, res, next) {
    if (!req.session.token) {
        return res.status(401).json({ message: "No session token found" });
    }
    return next();
}
export function verifyUserSignature(req, res, next) {
    const { walletAddress, signature } = req.body;
    const message = req.session?.message;
    if (!message) {
        return res.status(401).json({ success: false, message: "No session token" });
    }
    // Signature doğrulama
    const verifyResult = verifySignature(message, walletAddress, signature);
    if (!verifyResult) {
        res.status(400).json({ success: false, message: "Invalid signature" });
        return;
    }
    next();
}
export function validateRequestedEmail(req, res, next) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!req.body.email || !emailRegex.test(req.body.email)) {
        return res.status(400).json({ message: "Invalid email format" });
    }
    return next();
}
export function errorHandler(err, req, res, next) {
    console.error("Error:", err);
    return res.status(500).json({ message: "Internal server error" });
}
