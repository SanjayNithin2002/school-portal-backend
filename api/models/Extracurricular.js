var mongoose = require('mongoose');

var extracurricularScehma = mongoose.Schema({
    _id: mongoose.SchemaTypes.ObjectId,
    title: String,
    duration: Number,
    paymentDue: Date,
    timings: [{
        day: String,
        startTime: String,
        endTime: String,
    }],
    fees: Number,
    students : [{
        type : mongoose.SchemaTypes.ObjectId,
        ref : 'Students'
    }]
});

module.exports = mongoose.model('Extracurricular', extracurricularScehma);