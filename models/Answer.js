const mongoose = require("mongoose");
const Counter = require("./Counter");

const userAnswerSchema = new mongoose.Schema({
    uniqueId: { type: Number, unique: true },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    exam: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exam',
        required: true,
    },
    answers: [{
        question: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Question',
            required: true,
        },
        selectedOption: {
            type: Number,
            required: true,
        },
        answerHash: {
            type: String,
            required: true,
        },    
    }],
}, autoCreate = true,
).pre('save', async function (next) {
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

module.exports = mongoose.model("Answer", userAnswerSchema);