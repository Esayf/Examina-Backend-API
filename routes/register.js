const express = require("express");
const router = express.Router();
const User = require("../models/User");
var Client = require("mina-signer");
const transporter = require("../mailer.js");
// mainnet or testnet
const signerClient = new Client({ network: "mainnet" });

router.get("/session/get-message-to-sign/:walletAddress", (req, res) => {
  const { walletAddress } = req.params;
  const token = Math.random().toString(36).substring(7);
  // save token to user's session
  req.session.token = token;
  const message = `${req.session.token}${walletAddress}`;
  req.session.message =
    process.env.NODE_ENV !== "development" ? { message: message } : message;
  console.log("GET req.session.message: ", req.session.message);
  res.json({ message: message });
});

router.post("/", async (req, res) => {
  const { walletAddress, signature } = req.body;
  // console.log("Req.session.message: ", req.session.message);
  var signture =
    typeof signature === "string" ? JSON.parse(signature) : signature;
  const verifyBody = {
    data: req.session.message,
    publicKey: walletAddress,
    signature: signture,
  };
  console.log("Data: ", verifyBody.data);
  console.log("Public Key: ", verifyBody.publicKey);
  console.log("Signature: ", verifyBody.signature);

  const verifyResult = signerClient.verifyMessage(verifyBody);
  // console.log("Req.session.token: ", req.session.token);
  console.log("Verify Result: ", verifyResult);
  if (verifyResult && req.session.token) {
    // Create user if not exists
    try {
      const user = await User.find({ walletAddress: walletAddress });
      if (user.length == 0) {
        const newUser = new User({
          username: walletAddress,
          walletAddress,
        });
        const saved_user = await newUser.save();
        console.log("Saved user: ", saved_user);
        req.session.user = {
          userId: saved_user._id,
          walletAddress: saved_user.walletAddress,
        };
        return res.json({ success: true, session: req.session.user });
      } else {
        req.session.user = {
          userId: user[0]._id,
          walletAddress: user[0].walletAddress,
        };
        console.log("User already exists: ", user[0]);
        return res.json({ success: true, session: req.session.user });
      }
    } catch (err) {
      console.log(err);
    }
  } else {
    res.status(401).json({
      success: false,
      error: "Invalid signature or didn't have session token",
    });
  }
});

if (process.env.NODE_ENV === "development") {
  router.post("/dev", async (req, res) => {
    const { walletAddress, email } = req.body;
    // Create user if not exists
    try {
      const user = await User.find({ walletAddress: walletAddress });
      if (user.length == 0) {
        const newUser = new User({
          username: walletAddress,
          walletAddress,
          email: email,
        });
        const saved_user = await newUser.save();
        console.log("Saved user: ", saved_user);
        req.session.user = saved_user._id;
        return res.status(200).json({ success: true, user: req.session.user });
      } else {
        req.session.user = user[0]._id;
        console.log("User already exists: ", user[0]);
        return res.status(200).json({ success: true, user: req.session.user });
      }
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });
}

router.get("/session", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not authorized!" });
  }
  return res.json({ success: true, session: req.session.user });
});

router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Failed to logout!" });
    }
    return res.json({ success: true, message: "Logged out!" });
  });
});

module.exports = router;
