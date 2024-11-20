import mongoose, { Schema } from "mongoose";
const UserSchema = new Schema({
    username: {
        type: String,
        required: true,
    },
    walletAddress: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        unique: true,
        sparse: true,
    },
    isAdmin: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});
export default mongoose.model("User", UserSchema);
