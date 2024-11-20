import User from "../models/user.model.js";
import sessionHelper from "../helpers/sessionHelper.js";
async function getByWalletAddress(walletAddress) {
    try {
        return await User.find({ walletAddress });
    }
    catch (error) {
        console.error("Error finding user by wallet address: ", error);
        throw new Error("Error finding user by wallet address");
    }
}
async function getById(userId) {
    try {
        return await User.findById(userId);
    }
    catch (error) {
        console.error("Error finding user by ID: ", error);
        throw new Error("Error finding user by ID");
    }
}
async function getAll() {
    try {
        return await User.find();
    }
    catch (error) {
        console.error("Error finding all users: ", error);
        throw new Error("Error finding all users");
    }
}
async function create(walletAddress) {
    try {
        const isAdmin = walletAddress === process.env.ADMIN_PUBLIC_KEY;
        const newUser = new User({
            username: walletAddress,
            walletAddress: walletAddress,
            isAdmin: isAdmin,
        });
        return await newUser.save();
    }
    catch (error) {
        console.error("Error creating new user: ", error);
        throw new Error("Error creating new user");
    }
}
async function createAndRegister(req, walletAddress) {
    try {
        let newUser = await create(walletAddress);
        const sessionUser = {
            userId: newUser.id,
            walletAddress: newUser.walletAddress,
            isAdmin: newUser.isAdmin,
        };
        await sessionHelper.setSessionUser(req, sessionUser);
        return newUser;
    }
    catch (error) {
        console.error("Error creating and registering new user: ", error);
        throw new Error("Error creating and registering new user");
    }
}
async function findAndLogin(req, walletAddress) {
    try {
        let user = (await getByWalletAddress(walletAddress))[0];
        if (walletAddress === process.env.ADMIN_PUBLIC_KEY && !user.isAdmin) {
            user.isAdmin = true;
            await user.save();
        }
        const sessionUser = {
            userId: user.id,
            walletAddress: user.walletAddress,
            isAdmin: user.isAdmin,
        };
        await sessionHelper.setSessionUser(req, sessionUser);
        return user;
    }
    catch (error) {
        console.error("Error finding and logging in user: ", error);
        throw new Error("Error finding and logging in user");
    }
}
async function registerOrLogin(req, walletAddress) {
    try {
        let users = await getByWalletAddress(walletAddress);
        if (!users || users.length === 0) {
            return await createAndRegister(req, walletAddress);
        }
        else {
            return await findAndLogin(req, walletAddress);
        }
    }
    catch (error) {
        console.error("Error registering/logging in user: ", error);
        throw new Error("Error registering/logging in user");
    }
}
async function updateEmail(userId, email) {
    try {
        await User.findByIdAndUpdate(userId, { email });
    }
    catch (error) {
        console.error("Error updating user email: ", error);
        throw new Error("Error updating user email");
    }
}
async function verifyAdmin(userId) {
    try {
        const user = await User.findById(userId);
        return user?.isAdmin || false;
    }
    catch (error) {
        console.error("Error verifying admin status: ", error);
        return false;
    }
}
export default {
    getByWalletAddress,
    getById,
    getAll,
    create,
    registerOrLogin,
    updateEmail,
    verifyAdmin,
};
