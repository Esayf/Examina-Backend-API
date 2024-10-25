const mongoose = require("mongoose");
const Counter = require("./Counter");
const ScoreSchema = new mongoose.Schema({
    uniqueId: { type: Number, unique: true },

    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User",
    },
    exam: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "Exam",
    },
    score: {
        type: Number,
        required: true,
    }
}, autoCreate = true).pre('save', async function (next) {
    const doc = this;
    
    if (doc.isNew) {
      try {
        // Find the counter by ID (e.g., 'uniqueId') and increment the sequence value by 1
        const counter = await Counter.findOneAndUpdate(
          { _id: 'uniqueId' },  // Use a unique ID to identify the counter for this schema
          { $inc: { seq: 1 } }, // Increment the sequence
          { new: true, upsert: true } // If no counter exists, create a new one
        );
        
        // Set the `uniqueId` field to the incremented sequence value
        doc.uniqueId = counter.seq;
        next();
      } catch (err) {
        next(err);
      }
    } else {
      next();
    }
  });

module.exports = mongoose.model("Score", ScoreSchema);