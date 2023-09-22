// Adds a model to the mongoose library to allow exporting AdminAttendances. This is a bit tricky because you don't have to worry about the order of objects in the admin
var mongoose = require('mongoose');
var adminAttendanceSchema = mongoose.Schema({
    _id : mongoose.Schema.Types.ObjectId,
    admin : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Admins',
        required : true
    },
    date : Date,
    status : String
});

module.exports = mongoose.model('AdminAttendances', adminAttendanceSchema);