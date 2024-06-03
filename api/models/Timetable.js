var mongoose = require('mongoose');
var timetableSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    standard: Number,
    workingDays: [String],
    startTime: String,
    endTime: String,
    duration: Number,
    break: [{
        title: String,
        startTime: String,
        endTime: String
    }]
});

module.exports = mongoose.model('Timetable', timetableSchema);