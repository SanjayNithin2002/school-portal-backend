const AdminAttendance = require("api/models/AdminAttendance.js");

AdminAttendance.aggregate([
  {
    $match: {
      admin: mongoose.Types.ObjectId(adminId), // Filter by admin ID
      date: { $gte: startDate, $lte: endDate } // Filter by date range
    }
  },
  {
    $group: {
      _id: {
        admin: '$admin',
        date: '$date'
      },
      count: {
        $sum: {
          $cond: [
            {
              $or: [
                { $eq: ['$time', 'Present'] },
                { $eq: ['$time', 'FN'] }
              ]
            },
            1,
            0
          ]
        }
      }
    }
  }
], (err, results) => {
  if (err) {
    console.error(err);
    return;
  }

  console.log(results);
});
