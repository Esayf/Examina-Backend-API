const cron = require('node-cron');
const ParticipatedUser = require('../models/ParticipatedUser');
const examResultsQueue = require('../queues/examResultsQueue');

cron.schedule("*/3 * * * * *", async () => {
  try {
    let participated = await ParticipatedUser.aggregate([
      {
        $match: {
          isMailSent: false,
          isFinished: true,
          jobAdded: false, // Only select users for whom a job has not been added
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: '$user',
      },
      {
        $match: {
          'user.email': { $ne: null },
        },
      },
      {
        $lookup: {
          from: 'exams',
          localField: 'exam',
          foreignField: '_id',
          as: 'exam',
        },
      },
      {
        $match: {
          'exam.isCompleted': true, // Only select completed exams
        },
      },
      {
        $unwind: '$exam',
      },
      {
        $limit: 1, // Limit to one document to mimic findOne
      },
    ]);

    if (!participated || participated.length === 0) {
      console.log("No participated user found that needs to check score with email.");
      return;
    }

    participated = participated[0]; // Get the first document from the array

    examResultsQueue.add({ participated });

    await ParticipatedUser.updateOne(
      { _id: participated._id },
      { $set: { jobAdded: true } }
    );
  } catch (error) {
    console.error("Error scheduling job: ", error);
  }
});