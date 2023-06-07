var mongoose = require('mongoose');

var examSchema = mongoose.Schema({
    _id: mongoose.SchemaTypes.ObjectId,
    class: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Classes',
        required: true
    },
    date: Date,
    startTime: String,
    endTime: String,
    maxMarks: Number,
    examName: String,
    title : {
        name : String,
        sequence : Number
    }
});

module.exports = mongoose.model("Exams", examSchema);